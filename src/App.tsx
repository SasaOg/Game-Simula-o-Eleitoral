import { useState, useEffect } from 'react';
import { ElectionState, ElectionResults } from './types/election';
import { StudentVotingFlow } from './components/StudentVotingFlow';
import { PainelProfessor } from './components/PainelProfessor';
import { QRCodeModal } from './components/QRCodeModal';
import { ShieldCheck, GraduationCap, Vote, QrCode } from 'lucide-react';
import {
  subscribeToElectionState,
  subscribeToElectionResults,
  subscribeToPresences,
  subscribeToVotesCount,
  registerPresence,
  castVoteInFirestore,
  toggleUrnaInFirestore,
  presentCandidateInFirestore,
  tallyVotesFromFirestore,
  startSecondRoundInFirestore,
  resetElectionInFirestore,
  clearTestVotesInFirestore,
  FirestorePresenceDoc,
} from './services/electionFirestore';

// Identificador único do dispositivo mantido no localStorage
function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('urna_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('urna_device_id', id);
  }
  return id;
}

export default function App() {
  const [deviceId] = useState<string>(getOrCreateDeviceId);
  const [nickname, setNickname] = useState<string>(() => localStorage.getItem('urna_student_nickname') || '');
  const [currentMode, setCurrentMode] = useState<'aluno' | 'professor'>(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('modo') || params.get('mode');
    return mode === 'professor' ? 'professor' : 'aluno';
  });
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [electionState, setElectionState] = useState<ElectionState>({
    status: 'waiting',
    urnaOpen: false,
    currentRound: 1,
    activePresentation: null,
    activeCandidates: ['91', '92', '93'],
    totalConnected: 1,
    totalVotesRound1: 0,
    totalVotesRound2: 0,
  });

  const [presencesList, setPresencesList] = useState<FirestorePresenceDoc[]>([]);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [hasVotedCurrentRound, setHasVotedCurrentRound] = useState<boolean>(false);

  // Inscrições centrais em tempo real do Firebase Firestore
  useEffect(() => {
    // 1. Escuta estado central da eleição
    const unsubElection = subscribeToElectionState((data) => {
      setElectionState((prev) => ({
        ...prev,
        status: data.status === 'encerrada' ? 'finished' : data.status === 'votacao' ? 'voting' : data.status === 'apurando' ? 'tallying' : 'waiting',
        urnaOpen: data.urnaLiberada,
        currentRound: (data.turno === 2 ? 2 : 1),
        activePresentation: data.candidatoApresentadoId || null,
        activeCandidates: data.candidatosAtivos || ['91', '92', '93'],
      }));
    });

    // 2. Escuta resultados apurados (sincronizado para toda a turma e professor)
    const unsubResults = subscribeToElectionResults((res) => {
      setResults(res);
    });

    // 3. Escuta presenças dos alunos
    const unsubPresences = subscribeToPresences((presences: FirestorePresenceDoc[]) => {
      setPresencesList(presences);
      setElectionState((prev) => ({
        ...prev,
        totalConnected: Math.max(1, presences.length),
      }));
    });

    // 4. Escuta contagem de votos do 1º turno
    const unsubVotesR1 = subscribeToVotesCount(1, (count) => {
      setElectionState((prev) => ({
        ...prev,
        totalVotesRound1: count,
      }));
    });

    // 5. Escuta contagem de votos do 2º turno
    const unsubVotesR2 = subscribeToVotesCount(2, (count) => {
      setElectionState((prev) => ({
        ...prev,
        totalVotesRound2: count,
      }));
    });

    return () => {
      unsubElection();
      unsubResults();
      unsubPresences();
      unsubVotesR1();
      unsubVotesR2();
    };
  }, [deviceId]);

  // Atualiza hasVotedCurrentRound sempre que presenças ou turno mudarem
  useEffect(() => {
    const me = presencesList.find((p) => p.deviceId === deviceId);
    if (me) {
      setHasVotedCurrentRound(electionState.currentRound === 1 ? me.hasVotedRound1 : me.hasVotedRound2);
    } else {
      setHasVotedCurrentRound(false);
    }
  }, [presencesList, deviceId, electionState.currentRound]);

  // Registra presença automática se o aluno já tinha apelido salvo
  useEffect(() => {
    if (nickname) {
      registerPresence(deviceId, nickname);
    }
  }, [deviceId, nickname]);

  // Atualiza parâmetro da URL quando o modo mudar
  const handleModeChange = (newMode: 'aluno' | 'professor') => {
    setCurrentMode(newMode);
    const url = new URL(window.location.href);
    url.searchParams.set('modo', newMode);
    window.history.replaceState({}, '', url.toString());
  };

  // 1. Aluno entra na sessão
  const handleJoinSession = async (studentNickname: string) => {
    try {
      await registerPresence(deviceId, studentNickname);
      setNickname(studentNickname);
      localStorage.setItem('urna_student_nickname', studentNickname);
    } catch (err) {
      console.error('Erro ao registrar presença no Firestore:', err);
    }
  };

  // 2. Aluno registra voto (SECRETO)
  const handleCastVote = async (vote: string) => {
    try {
      await castVoteInFirestore(deviceId, vote, electionState.currentRound);
      // Mantém a tela da urna exibindo a mensagem oficial de voto registrado por 5 segundos
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setHasVotedCurrentRound(true);
    } catch (err) {
      console.error('Erro ao votar:', err);
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  // 3. Ações do Professor
  const handleToggleUrna = async (open: boolean) => {
    try {
      await toggleUrnaInFirestore(open);
    } catch (err) {
      console.error('Erro ao alterar urna:', err);
    }
  };

  const handlePresentCandidate = async (candidateId: string | null) => {
    try {
      await presentCandidateInFirestore(candidateId);
    } catch (err) {
      console.error('Erro ao apresentar candidato:', err);
    }
  };

  const handleTallyVotes = async () => {
    try {
      const res = await tallyVotesFromFirestore(
        electionState.currentRound,
        electionState.activeCandidates,
        electionState.totalConnected
      );
      setResults(res);
    } catch (err) {
      console.error('Erro ao apurar votos no Firestore:', err);
    }
  };

  const handleStartSecondRound = async (candidates: [string, string]) => {
    try {
      await startSecondRoundInFirestore(candidates);
      setHasVotedCurrentRound(false);
      setResults(null);
    } catch (err) {
      console.error('Erro ao iniciar 2º turno:', err);
    }
  };

  const handleResetElection = async () => {
    try {
      await resetElectionInFirestore();
      setHasVotedCurrentRound(false);
      setResults(null);
    } catch (err) {
      console.error('Erro ao reiniciar eleição:', err);
    }
  };

  const handleClearVotes = async () => {
    try {
      await clearTestVotesInFirestore();
      setHasVotedCurrentRound(false);
      setResults(null);
    } catch (err) {
      console.error('Erro ao limpar votos:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#171424] text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      
      {/* ========================================================
          BARRA DE NAVEGAÇÃO SUPERIOR
         ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#1e1930]/95 backdrop-blur-md border-b border-indigo-900/60 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Zone 1: Marca da Simulação */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl">🗳️</span>
            <div>
              <span className="font-pixel text-amber-400 text-sm sm:text-base tracking-wider font-bold block leading-none">
                VILA ESPERANÇA
              </span>
              <span className="text-[10px] text-slate-400 leading-none">
                Simulação Eleitoral Educativa
              </span>
            </div>
          </div>

          {/* Zone 2: Informações de Contexto */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Voto 100% Secreto</span>
            </div>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sincronizado ao Vivo (Nuvem)</span>
            </div>
          </div>

          {/* Zone 3: Apenas visão específica do modo ativo (sem expor modo professor para alunos) */}
          <div className="flex items-center gap-2">
            {currentMode === 'professor' ? (
              <>
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer border border-amber-300"
                  title="Exibir QR Code para os alunos entrarem pelo celular"
                >
                  <QrCode size={15} />
                  <span>QR Code Alunos</span>
                </button>

                <div className="flex items-center gap-1 bg-[#120f1f] p-1 rounded-xl border border-slate-700 shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm">
                    <GraduationCap size={14} />
                    <span>Painel Professor</span>
                  </div>

                  <button
                    onClick={() => handleModeChange('aluno')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Visualizar tela do aluno"
                  >
                    <span>Ver como Aluno</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                <Vote size={14} />
                <span>Sala de Votação</span>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ========================================================
          CONTEÚDO PRINCIPAL (Aluno ou Professor)
         ======================================================== */}
      <main className="flex-1 pb-10">
        {currentMode === 'aluno' ? (
          <StudentVotingFlow
            electionState={electionState}
            results={results}
            onCastVote={handleCastVote}
            onJoinSession={handleJoinSession}
            nickname={nickname}
            hasVotedCurrentRound={hasVotedCurrentRound}
          />
        ) : (
          <PainelProfessor
            electionState={electionState}
            results={results}
            onToggleUrna={handleToggleUrna}
            onPresentCandidate={handlePresentCandidate}
            onTallyVotes={handleTallyVotes}
            onStartSecondRound={handleStartSecondRound}
            onResetElection={handleResetElection}
            onClearVotes={handleClearVotes}
          />
        )}
      </main>

      {/* Modal do QR Code Global */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* ========================================================
          RODAPÉ EDUCATIVO
         ======================================================== */}
      <footer className="py-4 border-t border-slate-800 text-center text-xs text-slate-300">
        <p>
          Simulação Educativa de Eleição Municipal · Ensino Sociocultural · Vila Esperança
        </p>
      </footer>
    </div>
  );
}
