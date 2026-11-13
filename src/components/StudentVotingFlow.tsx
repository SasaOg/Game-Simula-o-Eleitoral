import React, { useState, useEffect } from 'react';
import { ElectionState, ElectionResults } from '../types/election';
import { CANDIDATES } from '../data/candidates';
import { UrnaEletronica } from './UrnaEletronica';
import { ColinhaModal } from './ColinhaModal';
import { MascotAvatar } from './MascotAvatar';
import { CandidateAvatar } from './CandidateAvatar';
import { audioSystem } from '../utils/audio';
import { Volume2, VolumeX, BookOpen, Clock, Trophy, ArrowRight, UserCheck } from 'lucide-react';

interface StudentVotingFlowProps {
  electionState: ElectionState;
  results: ElectionResults | null;
  onCastVote: (vote: string) => Promise<void>;
  onJoinSession: (nickname: string) => Promise<void>;
  nickname: string;
  hasVotedCurrentRound: boolean;
}

export const StudentVotingFlow: React.FC<StudentVotingFlowProps> = ({
  electionState,
  results,
  onCastVote,
  onJoinSession,
  nickname,
  hasVotedCurrentRound,
}) => {
  const [inputNickname, setInputNickname] = useState('');
  const [isColinhaOpen, setIsColinhaOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioSystem.getMuted());
  const [hasStartedAudio, setHasStartedAudio] = useState(false);

  // Manipulador de áudio e música de espera
  const toggleMute = () => {
    const nextMute = audioSystem.toggleMute();
    setIsMuted(nextMute);
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNickname.trim()) return;

    // Desbloqueia áudio no primeiro toque do aluno
    setHasStartedAudio(true);
    await onJoinSession(inputNickname.trim());
  };

  // Gerencia início da música de espera após votar ou durante espera de apuração
  useEffect(() => {
    if (hasStartedAudio && (hasVotedCurrentRound || electionState.status === 'tallying') && !results) {
      audioSystem.startWaitingMusic();
    } else {
      audioSystem.stopMusic();
    }

    return () => {
      audioSystem.stopMusic();
    };
  }, [hasStartedAudio, hasVotedCurrentRound, electionState.status, results]);

  // Se o aluno ainda não entrou com apelido
  if (!nickname) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md pixel-box p-6 rounded-xl relative">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-indigo-900/60">
            <MascotAvatar size={60} mood="happy" />
            <div>
              <div className="text-xs font-pixel text-amber-400 tracking-wider">
                JUSTIÇA ELEITORAL ESCOLAR
              </div>
              <h1 className="text-xl font-bold text-white font-pixel leading-tight">
                Eleição de Vila Esperança
              </h1>
              <p className="text-xs text-slate-300">
                Simulação educativa ao vivo
              </p>
            </div>
          </div>

          <div className="bg-[#171424] p-3 rounded-lg border border-amber-500/30 text-xs text-amber-200 mb-5 leading-relaxed">
            &quot;Olá, estudante! Hoje você vai decidir o futuro da nossa cidade votando na urna eletrônica. O seu voto é totalmente secreto!&quot;
          </div>

          <form onSubmit={handleStartSession} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Como podemos te chamar? (Apelido ou 1º Nome)
              </label>
              <input
                id="nickname"
                type="text"
                maxLength={20}
                required
                value={inputNickname}
                onChange={(e) => setInputNickname(e.target.value)}
                placeholder="Ex: Bia, Lucas, Pedro..."
                className="w-full px-4 py-3 bg-[#120f1f] border-2 border-slate-600 focus:border-amber-400 text-white rounded-lg outline-none text-base font-medium transition-colors"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
            >
              <span>Entrar na Sala de Votação</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsColinhaOpen(true)}
              className="text-xs text-slate-400 hover:text-amber-300 underline inline-flex items-center gap-1"
            >
              <BookOpen size={14} />
              <span>Ver colinha dos candidatos antes de entrar</span>
            </button>
          </div>
        </div>

        <ColinhaModal
          isOpen={isColinhaOpen}
          onClose={() => setIsColinhaOpen(false)}
          activeCandidateId={electionState.activePresentation}
          activeCandidates={electionState.activeCandidates}
        />
      </div>
    );
  }

  // Se temos resultados disponíveis OU status é finalizado, tem prioridade máxima
  const isShowingResults = Boolean(results || electionState.status === 'finished');

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-2 flex flex-col min-h-[90vh]">
      {/* Barra de Status e Ações Rápidas */}
      <div className="flex items-center justify-between gap-2 p-2.5 mb-3 bg-[#241e3a] border border-slate-700 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-900 border border-indigo-600 flex items-center justify-center text-xs font-bold text-amber-300">
            {nickname.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-none">
              {nickname}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Turno {electionState.currentRound} · Vila Esperança
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsColinhaOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <BookOpen size={14} />
            <span>Colinha</span>
          </button>

          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isMuted
                ? 'bg-red-950/60 border-red-700 text-red-300'
                : 'bg-slate-800 border-slate-600 text-slate-200'
            }`}
            title={isMuted ? 'Ativar sons' : 'Silenciar sons'}
            aria-label="Controle de áudio"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {/* Alerta de Candidato em Apresentação pelo Professor */}
      {electionState.activePresentation && CANDIDATES[electionState.activePresentation] && (
        <div className="mb-3 p-3 bg-[#241c38] border-2 border-emerald-400 rounded-xl shadow-lg transition-all animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] uppercase font-bold text-emerald-300">
                O Professor está apresentando agora:
              </span>
            </div>
            <button
              onClick={() => setIsColinhaOpen(true)}
              className="px-2.5 py-1 text-xs font-bold bg-amber-400 text-slate-950 rounded-lg hover:bg-amber-300 active:scale-95 transition-all cursor-pointer"
            >
              Abrir Colinha Completa
            </button>
          </div>

          <div className="flex items-center gap-3">
            <CandidateAvatar candidateId={electionState.activePresentation} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-base font-extrabold text-white truncate">
                  {CANDIDATES[electionState.activePresentation].name}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-sm font-mono shrink-0">
                  Nº {CANDIDATES[electionState.activePresentation].number}
                </span>
              </div>
              <div className="text-xs text-amber-300 font-semibold truncate">
                {CANDIDATES[electionState.activePresentation].focus}
              </div>
              <div className="text-[11px] text-slate-300 italic truncate">
                &quot;{CANDIDATES[electionState.activePresentation].slogan}&quot;
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ESTADO D: RESULTADO FINAL REVELADO (Apurado) - PRIORIDADE MÁXIMA
         ========================================================================= */}
      {isShowingResults ? (
        <div className="flex-1 flex flex-col items-center justify-center p-2 text-center animate-in zoom-in-95 duration-300">
          <div className="max-w-lg w-full pixel-box-gold p-6 rounded-xl">
            <Trophy size={48} className="text-amber-400 mx-auto mb-2 animate-bounce" />
            <div className="text-xs font-pixel text-amber-400 tracking-wider">
              {results ? `RESULTADO OFICIAL DE VILA ESPERANÇA (${results.round}º TURNO)` : 'RESULTADO OFICIAL DE VILA ESPERANÇA'}
            </div>

            {results ? (
              <>
                {/* 1. Vencedor Eleito */}
                {results.winnerId && CANDIDATES[results.winnerId] ? (
                  <div className="my-4 p-4 rounded-xl bg-amber-400 text-slate-950 shadow-lg">
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {results.round === 1 ? 'Eleito(a) no 1º Turno com Maioria Absoluta!' : 'Eleito(a) Prefeito(a) de Vila Esperança no 2º Turno!'}
                    </span>
                    <div className="flex items-center justify-center gap-3 my-2">
                      <CandidateAvatar candidateId={results.winnerId} size={50} />
                      <div className="text-left">
                        <div className="text-2xl font-black leading-tight">
                          {CANDIDATES[results.winnerId].name}
                        </div>
                        <div className="text-xs font-semibold">
                          Nº {CANDIDATES[results.winnerId].number} · {CANDIDATES[results.winnerId].focus}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold bg-slate-950/10 py-1 px-3 rounded inline-block">
                      {results.candidates[results.winnerId]?.percentValid || 0}% dos votos válidos ({results.candidates[results.winnerId]?.votes || 0} votos)
                    </div>
                  </div>
                ) : results.needsSecondRound ? (
                  /* 2. Segundo Turno Necessário */
                  <div className="my-4 p-4 rounded-xl bg-indigo-900 border-2 border-indigo-400 text-white shadow-lg">
                    <span className="text-xs font-bold uppercase text-amber-300 tracking-wider block">
                      HAVERÁ SEGUNDO TURNO!
                    </span>
                    <p className="text-xs text-slate-200 mt-1 mb-3">
                      Nenhum candidato atingiu mais de 50% dos votos válidos no 1º turno. Os 2 mais votados vão disputar a nova eleição:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-left">
                      {results.secondRoundCandidates?.map((candId) => (
                        <div key={candId} className="p-2.5 bg-slate-950/50 rounded-lg border border-indigo-400/50 text-xs">
                          <div className="font-bold text-amber-300">{CANDIDATES[candId]?.name || `Candidato ${candId}`}</div>
                          <div className="text-[11px] text-slate-300">Nº {CANDIDATES[candId]?.number || candId} · {CANDIDATES[candId]?.focus || ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="my-4 p-3 rounded-lg bg-slate-900 text-slate-200 text-xs">
                    Votação encerrada no {results.round}º Turno.
                  </div>
                )}

                {/* Resumo dos Votos */}
                <div className="space-y-2 text-left bg-[#1a1426] p-3 rounded-lg border border-slate-700 text-xs mb-4">
                  <div className="font-bold text-slate-300 border-b border-slate-700 pb-1 flex justify-between">
                    <span>Total de votos computados:</span>
                    <span className="font-mono text-amber-300 font-bold">{results.totalVotes}</span>
                  </div>
                  {Object.values(results.candidates).map((c) => (
                    <div key={c.number} className="flex justify-between items-center text-slate-200">
                      <span>{c.number} - {c.name}:</span>
                      <span className="font-mono font-bold text-amber-300">{c.votes} ({c.percentValid}% válidos)</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>Brancos: {results.blankVotes.votes}</span>
                    <span>Nulos: {results.nullVotes.votes}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  {results.needsSecondRound
                    ? 'Aguarde o professor iniciar o 2º Turno para votar novamente!'
                    : 'Acompanhe os comentários e debate final com o professor na aula!'}
                </p>
              </>
            ) : (
              <div className="py-8 space-y-2">
                <Clock size={24} className="text-amber-400 animate-spin mx-auto" />
                <p className="text-sm font-bold text-white">Apurando os votos finais...</p>
                <p className="text-xs text-slate-400">Os dados estão sendo computados na urna eletrônica.</p>
              </div>
            )}
          </div>
        </div>
      ) : !electionState.urnaOpen && !hasVotedCurrentRound ? (
        /* =========================================================================
            ESTADO A: SALA DE ESPERA (Urna ainda fechada pelo professor)
           ========================================================================= */
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md w-full pixel-box p-6 rounded-xl">
            <MascotAvatar size={70} mood="explaining" className="mx-auto mb-3" />
            <h2 className="text-lg font-bold text-amber-300 font-pixel mb-2">
              SALA DE ESPERA {electionState.currentRound === 2 ? '(2º TURNO)' : ''}
            </h2>
            <p className="text-sm text-slate-200 mb-4">
              A urna eletrônica está travada no momento. O professor vai liberar a votação para todos ao vivo!
            </p>

            <div className="p-3 bg-[#151224] rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-2 mb-5">
              <Clock size={16} className="text-amber-400 animate-spin" />
              <span>Aguardando comando do professor para abrir a urna...</span>
            </div>

            <button
              onClick={() => setIsColinhaOpen(true)}
              className="w-full py-3 px-4 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <BookOpen size={16} />
              <span>Aproveite para ler a colinha dos candidatos</span>
            </button>
          </div>
        </div>
      ) : electionState.urnaOpen && !hasVotedCurrentRound ? (
        /* =========================================================================
            ESTADO B: URNA ELETRÔNICA LIBERADA (Votação em Andamento)
           ========================================================================= */
        <div className="flex-1 flex flex-col items-center justify-center py-2 animate-in fade-in duration-200">
          <div className="w-full mb-3 flex items-center justify-between text-xs text-slate-300 px-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>Urna Liberada pelo Professor {electionState.currentRound === 2 ? '(2º Turno)' : ''}</span>
            </div>
            <span className="text-slate-400">Voto obrigatório e secreto</span>
          </div>

          <UrnaEletronica
            onVoteSubmitted={onCastVote}
            activeCandidates={electionState.activeCandidates}
            currentRound={electionState.currentRound}
          />
        </div>
      ) : (
        /* =========================================================================
            ESTADO C: VOTO REGISTRADO / ESPERA DA APURAÇÃO DOS VOTOS
           ========================================================================= */
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md w-full pixel-box p-6 rounded-xl animate-in zoom-in-95 duration-200">
            <MascotAvatar size={70} mood="happy" className="mx-auto mb-3" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-400 text-emerald-300 rounded-full text-xs font-bold mb-3">
              <UserCheck size={14} />
              <span>Seu voto foi registrado com sigilo absoluto!</span>
            </div>

            <h2 className="text-xl font-bold text-white font-pixel mb-2">
              AGUARDANDO A APURAÇÃO
            </h2>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Você já votou no {electionState.currentRound}º turno. Ninguém sabe o seu voto. Fique atento à tela compartilhada do professor para o resultado!
            </p>

            <button
              onClick={() => setIsColinhaOpen(true)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-600"
            >
              <BookOpen size={15} />
              <span>Rever propostas dos candidatos</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal da Colinha dos Candidatos */}
      <ColinhaModal
        isOpen={isColinhaOpen}
        onClose={() => setIsColinhaOpen(false)}
        activeCandidateId={electionState.activePresentation}
        activeCandidates={electionState.activeCandidates}
      />
    </div>
  );
};
