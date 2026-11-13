import React, { useState } from 'react';
import { ElectionResults } from '../types/election';
import { CANDIDATES } from '../data/candidates';
import { CandidateAvatar } from './CandidateAvatar';
import { 
  Trophy, AlertTriangle, ArrowRight, X, Users, CheckCircle, 
  Vote, HelpCircle, Sparkles, PieChart, ShieldCheck
} from 'lucide-react';

interface ResultadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ElectionResults | null;
  onStartSecondRound: (candidates: [string, string]) => Promise<void>;
}

export const ResultadoModal: React.FC<ResultadoModalProps> = ({
  isOpen,
  onClose,
  results,
  onStartSecondRound,
}) => {
  const [selectedTieFinalists, setSelectedTieFinalists] = useState<[string, string] | null>(null);
  const [isStartingSecondRound, setIsStartingSecondRound] = useState(false);

  if (!isOpen || !results) return null;

  const winner = results.winnerId ? CANDIDATES[results.winnerId] : null;

  const handleStartRound2 = async () => {
    const finalists = selectedTieFinalists || results.secondRoundCandidates;
    if (finalists && finalists.length === 2) {
      setIsStartingSecondRound(true);
      await onStartSecondRound(finalists);
      setIsStartingSecondRound(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#211a36] border-2 border-amber-400 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* ========================================================
            TOPO DO MODAL (Header com Título e Fechar)
           ======================================================== */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#292042] border-b border-amber-400/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow">
              <Trophy size={20} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-amber-300 font-pixel tracking-wider leading-none">
                  RESULTADO OFICIAL DA APURAÇÃO
                </h2>
                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px] uppercase font-mono">
                  {results.round}º TURNO
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Vila Esperança · Urna Eletrônica Escolar Sincronizada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              title="Fechar pop-up e voltar ao painel"
              aria-label="Fechar pop-up"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================
            CORPO DO MODAL COM ROLAGEM
           ======================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* 1. CARTÃO DE DESTAQUE: ELEITO(A) OU SEGUNDO TURNO */}
          {winner ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 shadow-xl border-2 border-amber-200">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                <Sparkles size={16} />
                <span>
                  {results.round === 1
                    ? 'Vitória no 1º Turno com Maioria Absoluta dos Votos Válidos!'
                    : 'Prefeito(a) Eleito(a) no 2º Turno de Vila Esperança!'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <CandidateAvatar candidateId={winner.id} size={64} />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Nº {winner.number} · {winner.focus}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
                      {winner.name}
                    </div>
                    <div className="text-xs text-slate-800 italic mt-0.5">
                      &quot;{winner.slogan}&quot;
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/15 rounded-xl border border-slate-950/20 text-center shrink-0 min-w-[160px]">
                  <div className="text-xs uppercase font-bold text-slate-800">Votos Válidos:</div>
                  <div className="text-3xl font-black font-mono text-slate-950">
                    {results.candidates[winner.id]?.percentValid || 0}%
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800">
                    {results.candidates[winner.id]?.votes || 0} votos recebidos
                  </div>
                </div>
              </div>
            </div>
          ) : results.needsSecondRound ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-[#261f44] to-indigo-950 border-2 border-amber-400 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm uppercase tracking-wide">
                <AlertTriangle size={20} className="text-amber-400 animate-pulse" />
                <span>ELEIÇÃO VAI PARA O SEGUNDO TURNO!</span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                <strong>Regra Constitucional da Maioria Absoluta:</strong> No 1º turno, para vencer direto, é necessário ter mais de 50% dos votos válidos. Como nenhum candidato atingiu essa marca, os 2 mais votados avançam para a votação final.
              </p>

              {/* Finalistas do 2º Turno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {results.secondRoundCandidates?.map((candId, idx) => {
                  const cand = CANDIDATES[candId];
                  const cResult = results.candidates[candId];
                  return (
                    <div
                      key={candId}
                      className="p-3 bg-[#181329] border border-amber-400/50 rounded-xl flex items-center justify-between gap-3 shadow"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CandidateAvatar candidateId={candId} size={42} />
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-amber-400 truncate">
                            {idx === 0 ? '1º Mais Votado' : '2º Mais Votado'}
                          </div>
                          <div className="text-sm font-black text-white truncate">
                            {cand?.name || `Candidato ${candId}`}
                          </div>
                          <div className="text-[11px] text-slate-300 truncate">
                            Nº {cand?.number || candId} · {cand?.focus || ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black font-mono text-amber-300">
                          {cResult?.percentValid || 0}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {cResult?.votes || 0} votos
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Alerta de Empate se houver */}
              {results.tieDetected && results.tieCandidates && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-red-300 flex items-center gap-1.5">
                    <HelpCircle size={15} />
                    <span>Houve empate na 2ª colocação! Selecione quem avança:</span>
                  </div>
                  <div className="flex gap-2">
                    {results.tieCandidates.map((cId) => (
                      <button
                        key={cId}
                        onClick={() => {
                          const other = Object.keys(results.candidates).find(id => !results.tieCandidates?.includes(id)) || '91';
                          setSelectedTieFinalists([other, cId]);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          selectedTieFinalists?.[1] === cId
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        Avançar {CANDIDATES[cId]?.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão de Iniciar 2º Turno direto no Pop-up */}
              <div className="pt-2">
                <button
                  onClick={handleStartRound2}
                  disabled={isStartingSecondRound}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <span>Iniciar 2º Turno com os Finalistas</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs">
              Apuração concluída no {results.round}º Turno.
            </div>
          )}

          {/* 2. GRÁFICO DE BARRAS COMPARATIVO */}
          <div className="p-4 bg-[#19142b] border border-slate-700/80 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <PieChart size={15} className="text-amber-400" />
                <span>Desempenho dos Candidatos (% dos Votos Válidos)</span>
              </span>
              <span className="text-[11px] text-slate-400">Total Válidos: {results.validVotes}</span>
            </div>

            <div className="space-y-3">
              {Object.values(results.candidates).map((cand) => (
                <div key={cand.number} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
                    <div className="flex items-center gap-2">
                      <CandidateAvatar candidateId={cand.number} size={26} />
                      <span className="font-bold">Nº {cand.number} - {cand.name}</span>
                      <span className="text-slate-400 text-[11px]">({cand.focus})</span>
                    </div>
                    <div className="font-mono text-xs">
                      <span className="text-amber-300 font-bold">{cand.votes} votos</span>
                      <span className="text-slate-400 ml-2">({cand.percentValid}%)</span>
                    </div>
                  </div>

                  <div className="h-6 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(cand.percentValid, 2)}%` }}
                    >
                      {cand.percentValid > 8 && (
                        <span className="text-[10px] font-black text-slate-950 font-mono">
                          {cand.percentValid}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. RESUMO ESTATÍSTICO COMPLETO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#19142b] border border-slate-800 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Computado</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">{results.totalVotes}</div>
              <div className="text-[10px] text-slate-400">100% dos votos</div>
            </div>

            <div className="p-3 bg-[#19142b] border border-slate-800 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Votos Válidos</div>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{results.validVotes}</div>
              <div className="text-[10px] text-slate-400">Decidem a eleição</div>
            </div>

            <div className="p-3 bg-[#19142b] border border-slate-800 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Votos Brancos</div>
              <div className="text-xl font-black text-slate-300 font-mono mt-0.5">{results.blankVotes.votes}</div>
              <div className="text-[10px] text-slate-400">{results.blankVotes.percentTotal}% do total</div>
            </div>

            <div className="p-3 bg-[#19142b] border border-slate-800 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-red-400">Votos Nulos</div>
              <div className="text-xl font-black text-red-400 font-mono mt-0.5">{results.nullVotes.votes}</div>
              <div className="text-[10px] text-slate-400">{results.nullVotes.percentTotal}% do total</div>
            </div>
          </div>

          {/* 4. DADOS DE PARTICIPAÇÃO E ABSTENÇÃO */}
          <div className="p-3 bg-[#151124] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-indigo-400" />
              <span>Alunos Conectados na Sala: <strong>{results.connectedStudents}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>Abstenções / Não Votaram: <strong>{results.abstentions}</strong></span>
            </div>
          </div>
        </div>

        {/* ========================================================
            RODAPÉ DO MODAL (Ações)
           ======================================================== */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#292042] border-t border-slate-800 shrink-0">
          <p className="text-[11px] text-slate-300">
            {results.needsSecondRound
              ? 'Você pode iniciar o 2º turno pelo botão acima ou fechar para revisar os candidatos.'
              : 'Resultado consolidado da urna eletrônica de Vila Esperança.'}
          </p>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-700"
          >
            Fechar Pop-up
          </button>
        </div>

      </div>
    </div>
  );
};
