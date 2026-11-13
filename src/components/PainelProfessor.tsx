import React, { useState, useEffect } from 'react';
import { ElectionState, ElectionResults } from '../types/election';
import { CANDIDATES } from '../data/candidates';
import { CandidateAvatar } from './CandidateAvatar';
import { ColinhaModal } from './ColinhaModal';
import { QRCodeModal } from './QRCodeModal';
import { ResultadoModal } from './ResultadoModal';
import { audioSystem } from '../utils/audio';
import { getPublicStudentUrl } from '../utils/url';
import { 
  Users, CheckCircle, Lock, Unlock, Play, RotateCcw, 
  Volume2, VolumeX, Sparkles, BookOpen, Trophy, AlertTriangle, ArrowRight, QrCode, Copy, Check, Trash2
} from 'lucide-react';
import { simulateVotesInFirestore, clearTestVotesInFirestore } from '../services/electionFirestore';

interface PainelProfessorProps {
  electionState: ElectionState;
  results: ElectionResults | null;
  onToggleUrna: (open: boolean) => Promise<void>;
  onPresentCandidate: (id: string | null) => Promise<void>;
  onTallyVotes: () => Promise<void>;
  onStartSecondRound: (candidates: [string, string]) => Promise<void>;
  onResetElection: () => Promise<void>;
  onClearVotes?: () => Promise<void>;
}

export const PainelProfessor: React.FC<PainelProfessorProps> = ({
  electionState,
  results,
  onToggleUrna,
  onPresentCandidate,
  onTallyVotes,
  onStartSecondRound,
  onResetElection,
  onClearVotes,
}) => {
  const [isColinhaOpen, setIsColinhaOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [teacherMusicPlaying, setTeacherMusicPlaying] = useState(false);
  const [isTallyingAnimation, setIsTallyingAnimation] = useState(false);
  const [selectedTieFinalists, setSelectedTieFinalists] = useState<[string, string] | null>(null);

  // Abre automaticamente o pop-up assim que novos resultados forem computados
  useEffect(() => {
    if (results) {
      setIsResultsModalOpen(true);
    }
  }, [results?.round, results?.totalVotes]);

  // Controle de música no computador do professor
  const toggleTeacherMusic = () => {
    if (teacherMusicPlaying) {
      audioSystem.stopMusic();
      setTeacherMusicPlaying(false);
    } else {
      audioSystem.startWaitingMusic();
      setTeacherMusicPlaying(true);
    }
  };

  // Ação de apuração com o rufar de caixa obrigatório e abertura do pop-up
  const handleApurarClick = async () => {
    setIsTallyingAnimation(true);
    if (teacherMusicPlaying) {
      audioSystem.stopMusic();
      setTeacherMusicPlaying(false);
    }

    // Toca o rufar de caixa oficial de ~2s gerado por ruído filtrado
    await audioSystem.playDrumRoll();
    await onTallyVotes();
    setIsTallyingAnimation(false);
    setIsResultsModalOpen(true);
  };

  const totalVotedCurrentRound = electionState.currentRound === 1 
    ? electionState.totalVotesRound1 
    : electionState.totalVotesRound2;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* ========================================================
          BARRA DE CONTROLE SUPERIOR (Compartilhamento de Tela)
         ======================================================== */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-[#251f3b] border-2 border-amber-400/60 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-bold text-xs uppercase font-pixel tracking-wider">
              PAINEL DO PROFESSOR
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Eleição Municipal de Vila Esperança · {electionState.currentRound}º Turno
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Controle da Votação & Apuração ao Vivo
          </h1>
        </div>

        {/* Estatísticas de Presença e Votação em Tempo Real (Formato Otimizado e Alinhado) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="min-w-[125px] h-[68px] px-3 py-2 rounded-xl bg-[#161228] border border-indigo-500/50 flex flex-col items-center justify-center shadow-inner">
            <div className="flex items-center justify-center gap-1.5 text-indigo-300 text-xs font-semibold whitespace-nowrap">
              <Users size={15} />
              <span>Conectados</span>
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight leading-none mt-1">
              {electionState.totalConnected}
            </div>
          </div>

          <div className="min-w-[125px] h-[68px] px-3 py-2 rounded-xl bg-[#0f1f1d] border border-emerald-500/60 flex flex-col items-center justify-center shadow-inner">
            <div className="flex items-center justify-center gap-1.5 text-emerald-300 text-xs font-semibold whitespace-nowrap">
              <CheckCircle size={15} />
              <span>Já Votaram</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight leading-none mt-1">
              {totalVotedCurrentRound}
            </div>
          </div>

          {/* Botão de QR Code para Alunos */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer border border-amber-300"
            title="Abrir QR Code na tela para os alunos escanearem"
          >
            <QrCode size={16} />
            <span>QR Code</span>
          </button>

          {/* Botão Copiar Link Direto para Chat */}
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(getPublicStudentUrl());
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              } catch {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border ${
              copiedLink
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Copiar link direto do Modo Aluno para colar no chat da aula"
          >
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Alunos'}</span>
          </button>

          {/* Botão de música local do professor */}
          <button
            onClick={toggleTeacherMusic}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              teacherMusicPlaying
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {teacherMusicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Música na minha tela</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          BARRA DE AÇÕES DO PROFESSOR (Liberar, Fechar, Apurar, Reset)
         ======================================================== */}
      <div className="p-4 bg-[#1e1930] rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Status da Urna */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs">
            <span className="text-slate-400">Estado da Urna:</span>
            {electionState.urnaOpen ? (
              <span className="flex items-center gap-1 font-bold text-emerald-400">
                <Unlock size={14} /> Aberta para os alunos
              </span>
            ) : (
              <span className="flex items-center gap-1 font-bold text-red-400">
                <Lock size={14} /> Fechada / Bloqueada
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Liberar / Fechar Urna */}
          {electionState.urnaOpen ? (
            <button
              onClick={() => onToggleUrna(false)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Lock size={15} />
              <span>Travar Urna Temporariamente</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleUrna(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Unlock size={15} />
              <span>Liberar Urna para Votação</span>
            </button>
          )}

          {/* Botão de Apurar com Rufar de Tambor */}
          <button
            onClick={handleApurarClick}
            disabled={isTallyingAnimation}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs rounded-lg flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Play size={16} />
            <span>{isTallyingAnimation ? 'Rufando os tambores...' : 'Apurar Votos'}</span>
          </button>

          {/* Botão de Ver Resultado no Pop-up se já houver apuração */}
          {results && (
            <button
              onClick={() => setIsResultsModalOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-amber-300 animate-pulse"
              title="Abrir novamente o pop-up com o resultado da apuração na tela"
            >
              <Trophy size={15} />
              <span>Ver Resultado no Pop-up</span>
            </button>
          )}

          {/* Botão para o professor simular votos de teste */}
          <button
            onClick={async () => {
              try {
                await simulateVotesInFirestore(5, electionState.currentRound, electionState.activeCandidates);
              } catch (e) {
                console.error('Erro ao simular votos:', e);
              }
            }}
            className="px-3 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Gera 5 votos aleatórios simulados para o professor testar a apuração e o 2º turno"
          >
            <Users size={14} />
            <span>+5 Votos Teste</span>
          </button>

          {/* Botão para limpar votos de teste */}
          <button
            onClick={async () => {
              if (window.confirm('Deseja zerar os votos computados e limpar os dados de teste?')) {
                try {
                  if (onClearVotes) {
                    await onClearVotes();
                  } else {
                    await clearTestVotesInFirestore();
                  }
                } catch (e) {
                  console.error('Erro ao limpar votos:', e);
                }
              }
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Zera os votos e limpa os participantes simulados para novo teste"
          >
            <Trash2 size={14} />
            <span>Limpar Votos</span>
          </button>

          {/* Botão de Abrir Colinha */}
          <button
            onClick={() => setIsColinhaOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <BookOpen size={15} />
            <span>Colinha Modal</span>
          </button>

          {/* Reiniciar Eleição */}
          <button
            onClick={() => {
              if (window.confirm('Tem certeza de que deseja reiniciar toda a eleição e zerar os votos?')) {
                onResetElection();
              }
            }}
            className="px-3 py-2 bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-800 cursor-pointer transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reiniciar Eleição</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          COLINHA DA TURMA: 3 CANDIDATOS EM TELA GRANDE
         ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-400">📋</span>
              <span>Colinha da Turma (Candidatos de Vila Esperança)</span>
            </h2>
            <p className="text-xs text-slate-300">
              Clique em &quot;Apresentar Candidato&quot; para destacar o cartão na tela de todos os celulares simultaneamente.
            </p>
          </div>

          {electionState.activePresentation && (
            <button
              onClick={() => onPresentCandidate(null)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center gap-1"
            >
              <span>Remover Destaque da Turma</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {['91', '92', '93'].map((id) => {
            const cand = CANDIDATES[id];
            const isPresented = electionState.activePresentation === id;
            const isRoundActive = electionState.activeCandidates.includes(id);

            return (
              <div
                key={id}
                className={`relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                  isPresented
                    ? 'border-emerald-400 bg-[#2b2447] ring-2 ring-emerald-400/40 shadow-xl'
                    : isRoundActive
                    ? 'border-slate-700 bg-[#201a33] hover:border-slate-600'
                    : 'border-slate-800 bg-[#171324] opacity-50'
                }`}
              >
                <div>
                  {/* Topo com Número e Foto Compactos */}
                  <div className="flex items-center justify-between gap-2.5 mb-2.5 pb-2.5 border-b border-slate-700/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CandidateAvatar candidateId={cand.id} size={46} />
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold truncate">
                          {cand.focus}
                        </div>
                        <div className="text-base font-extrabold text-white leading-tight truncate">
                          {cand.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {cand.age} anos · {cand.profession}
                        </div>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xl font-mono shadow shrink-0">
                      {cand.number}
                    </div>
                  </div>

                  {/* Slogan */}
                  <div className="mb-2 px-2.5 py-1 rounded bg-slate-900/70 border border-slate-700/60 text-[11px] italic text-amber-200">
                    &quot;{cand.slogan}&quot;
                  </div>

                  {/* Mini Biografia Compacta */}
                  <p className="text-[11px] text-slate-300 mb-2.5 leading-relaxed line-clamp-3">
                    {cand.bio}
                  </p>

                  {/* 3 Propostas Compactas */}
                  <div className="space-y-1 mb-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Propostas:
                    </div>
                    {cand.proposals.map((prop, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-200 leading-snug">
                        <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{prop}</span>
                      </div>
                    ))}
                  </div>

                  {/* Quem Paga e Pergunta do Povo Compactas (Grid 2 colunas para economizar altura) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-red-950/25 border border-red-500/25 text-[10px]">
                      <div className="font-bold text-red-300 text-[10px] mb-0.5">
                        QUEM PAGA:
                      </div>
                      <p className="text-slate-300 text-[10px] leading-tight">{cand.whoPays}</p>
                    </div>

                    <div className="p-2 rounded-lg bg-blue-950/25 border border-blue-500/25 text-[10px]">
                      <div className="font-bold text-blue-300 text-[10px] mb-0.5">
                        PERGUNTA DO POVO:
                      </div>
                      <p className="text-slate-300 text-[10px] leading-tight italic">&quot;{cand.peopleQuestion}&quot;</p>
                    </div>
                  </div>
                </div>

                {/* Botão de Apresentar ao Vivo */}
                <div className="mt-2 pt-2 border-t border-slate-700/80">
                  {isPresented ? (
                    <button
                      onClick={() => onPresentCandidate(null)}
                      className="w-full py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Remover Destaque da Turma
                    </button>
                  ) : (
                    <button
                      onClick={() => onPresentCandidate(cand.id)}
                      disabled={!isRoundActive}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Sparkles size={14} />
                      Apresentar à turma
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          RESULTADOS & GRÁFICO DE APURAÇÃO
         ======================================================== */}
      {results && (
        <div className="p-6 bg-[#211a36] border-2 border-indigo-400/50 rounded-2xl shadow-2xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <Trophy size={24} className="text-amber-400" />
                <h3 className="text-2xl font-black text-white font-pixel">
                  RESULTADO DA APURAÇÃO ({results.round}º TURNO)
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Total de votos computados: <span className="font-bold text-amber-300">{results.totalVotes}</span> · 
                Votos Válidos: <span className="font-bold text-emerald-400">{results.validVotes}</span> · 
                Brancos: {results.blankVotes.votes} · Nulos: {results.nullVotes.votes} · 
                Alunos conectados: {results.connectedStudents}
              </p>
            </div>

            {/* Vencedor ou Segundo Turno */}
            {results.winnerId && CANDIDATES[results.winnerId] ? (
              <div className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg">
                <Trophy size={18} />
                <span>ELEITO(A): {CANDIDATES[results.winnerId].name}</span>
              </div>
            ) : results.needsSecondRound ? (
              <div className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg">
                <AlertTriangle size={18} />
                <span>SEGUNDO TURNO NECESSÁRIO!</span>
              </div>
            ) : null}
          </div>

          {/* Gráfico de Barras Grande e Comparativo */}
          <div className="space-y-4 mb-6">
            {Object.values(results.candidates).map((cand) => (
              <div key={cand.number} className="space-y-1">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-200">
                  <div className="flex items-center gap-2">
                    <CandidateAvatar candidateId={cand.number} size={28} />
                    <span>Nº {cand.number} - {cand.name} ({cand.focus})</span>
                  </div>
                  <div className="font-mono text-sm">
                    <span className="text-amber-300 font-bold">{cand.votes} votos</span>
                    <span className="text-slate-400 ml-2">({cand.percentValid}% dos válidos)</span>
                  </div>
                </div>

                {/* Barra com progresso */}
                <div className="h-7 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 relative">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(cand.percentValid, 2)}%` }}
                  >
                    {cand.percentValid > 8 && (
                      <span className="text-xs font-black text-slate-950 font-mono">
                        {cand.percentValid}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Barras de Brancos e Nulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-700/60">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Votos em Branco</span>
                  <span className="font-mono font-bold text-slate-200">
                    {results.blankVotes.votes} ({results.blankVotes.percentTotal}% total)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 transition-all duration-500"
                    style={{ width: `${results.blankVotes.percentTotal}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Votos Nulos</span>
                  <span className="font-mono font-bold text-slate-200">
                    {results.nullVotes.votes} ({results.nullVotes.percentTotal}% total)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${results.nullVotes.percentTotal}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Decisão e Transição de 2º Turno */}
          {results.needsSecondRound && results.round === 1 && (
            <div className="p-4 bg-indigo-950/80 border-2 border-amber-400/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Regra Eleitoral: Nenhum candidato obteve mais de 50% dos votos válidos.</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Para vencer no 1º turno, um candidato precisa de maioria absoluta (&gt; 50% dos votos válidos). Como ninguém atingiu essa marca, a eleição vai para o <strong>Segundo Turno</strong> entre os dois candidatos mais votados.
              </p>

              {/* Caso de empate em 2º lugar */}
              {results.tieDetected && results.tieCandidates ? (
                <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-xs space-y-2">
                  <span className="font-bold text-red-300">
                    Empate detectado para a vaga no 2º turno! O professor escolhe quem avança:
                  </span>
                  <div className="flex gap-2">
                    {results.tieCandidates.map(cId => (
                      <button
                        key={cId}
                        onClick={() => {
                          const otherFinalist = Object.keys(results.candidates).find(id => !results.tieCandidates?.includes(id)) || '91';
                          setSelectedTieFinalists([otherFinalist, cId]);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                          selectedTieFinalists?.[1] === cId
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                      >
                        Avançar {CANDIDATES[cId]?.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Botão de Iniciar 2º Turno */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    const finalists = selectedTieFinalists || results.secondRoundCandidates;
                    if (finalists && finalists.length === 2) {
                      onStartSecondRound(finalists);
                    }
                  }}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Iniciar 2º Turno com os 2 Mais Votados</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal da Colinha */}
      <ColinhaModal
        isOpen={isColinhaOpen}
        onClose={() => setIsColinhaOpen(false)}
        isTeacherMode
        activeCandidateId={electionState.activePresentation}
        onPresentCandidate={onPresentCandidate}
        activeCandidates={electionState.activeCandidates}
      />

      {/* Modal do QR Code de Acesso dos Alunos */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* Pop-up Automático com o Resultado da Apuração */}
      <ResultadoModal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        results={results}
        onStartSecondRound={async (finalists) => {
          setIsResultsModalOpen(false);
          await onStartSecondRound(finalists);
        }}
      />
    </div>
  );
};
