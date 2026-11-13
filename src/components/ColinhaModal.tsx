import React, { useState, useEffect } from 'react';
import { CANDIDATES } from '../data/candidates';
import { CandidateAvatar } from './CandidateAvatar';
import { X, ChevronLeft, ChevronRight, HelpCircle, DollarSign, Sparkles, CheckCircle2 } from 'lucide-react';

interface ColinhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  isTeacherMode?: boolean;
  onPresentCandidate?: (id: string | null) => void;
  activeCandidates?: string[];
}

export const ColinhaModal: React.FC<ColinhaModalProps> = ({
  isOpen,
  onClose,
  activeCandidateId = null,
  isTeacherMode = false,
  onPresentCandidate,
  activeCandidates = ['91', '92', '93']
}) => {
  const [mobileIndex, setMobileIndex] = useState(0);

  // Filtrar apenas candidatos ativos no turno atual (ex: 2º turno)
  const candidateKeys = activeCandidates.length > 0 ? activeCandidates : ['91', '92', '93'];
  const candidatesList = candidateKeys.map(k => CANDIDATES[k]).filter(Boolean);

  // Sincroniza o candidato ativo imediatamente quando o professor apresentar
  useEffect(() => {
    if (activeCandidateId) {
      const idx = candidatesList.findIndex(c => c.id === activeCandidateId);
      if (idx !== -1) {
        setMobileIndex(idx);
      }
    }
  }, [activeCandidateId, candidateKeys.join(',')]);

  if (!isOpen) return null;

  const currentMobileCandidate = candidatesList[mobileIndex] || candidatesList[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#1e1930] border-2 border-amber-400 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#292240] border-b border-amber-400/40">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-300 font-pixel tracking-wider leading-none">
                COLINHA DOS CANDIDATOS
              </h2>
              <p className="text-[11px] text-slate-300 leading-tight">
                Vila Esperança · Cargo: Prefeito(a)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg border border-slate-600 transition-all cursor-pointer"
            aria-label="Fechar colinha"
          >
            <X size={15} />
            <span>Fechar</span>
          </button>
        </div>

        {/* Informação / Alerta de apresentação */}
        <div className="px-3.5 py-1.5 bg-amber-950/30 border-b border-amber-500/20 text-[11px] text-amber-200 flex items-center justify-between">
          <span>💡 Memorize o número de 2 dígitos do seu candidato para digitar na urna.</span>
          {isTeacherMode && (
            <span className="font-semibold text-emerald-400 hidden sm:inline">
              Modo Professor: Destaque o candidato para a turma ao vivo.
            </span>
          )}
        </div>

        {/* Conteúdo Otimizado */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          
          {/* ========================================================
              VISUALIZAÇÃO DESKTOP: Grid 3 Colunas Compacto (Sem Cortar)
             ======================================================== */}
          <div className="hidden md:grid md:grid-cols-3 gap-3.5 items-stretch">
            {candidatesList.map((cand) => {
              const isPresented = activeCandidateId === cand.id;
              return (
                <div
                  key={cand.id}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border-2 transition-all ${
                    isPresented
                      ? 'border-emerald-400 bg-[#2b2447] shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                      : 'border-slate-700 bg-[#221c36] hover:border-slate-600'
                  }`}
                >
                  <div>
                    {/* Alerta de destaque se estiver apresentado */}
                    {isPresented && (
                      <div className="mb-2 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                        <Sparkles size={11} />
                        <span>Destacado pelo Professor</span>
                      </div>
                    )}

                    {/* Topo com Foto e Número */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-700/80">
                      <div className="flex items-center gap-2 min-w-0">
                        <CandidateAvatar candidateId={cand.id} size={44} />
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold truncate">
                            {cand.focus}
                          </div>
                          <div className="text-sm font-extrabold text-white leading-tight truncate">
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
                    <div className="mb-2 px-2 py-1 rounded bg-slate-900/60 border border-slate-700/60 text-[11px] italic text-amber-200">
                      &quot;{cand.slogan}&quot;
                    </div>

                    {/* Mini Bio */}
                    <p className="text-[11px] text-slate-300 mb-2 leading-relaxed line-clamp-3">
                      {cand.bio}
                    </p>

                    {/* 3 Propostas */}
                    <div className="mb-2 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Propostas:
                      </div>
                      {cand.proposals.map((prop, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-200 leading-snug">
                          <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{prop}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quem paga & Pergunta do povo (2 colunas compactas) */}
                    <div className="grid grid-cols-1 gap-1.5">
                      <div className="p-1.5 rounded-lg bg-red-950/25 border border-red-500/25 text-[10px]">
                        <div className="flex items-center gap-1 font-bold text-red-300 text-[10px] mb-0.5">
                          <DollarSign size={11} className="text-red-400" />
                          <span>QUEM PAGA A CONTA:</span>
                        </div>
                        <p className="text-slate-300 text-[10px] leading-tight">{cand.whoPays}</p>
                      </div>

                      <div className="p-1.5 rounded-lg bg-blue-950/25 border border-blue-500/25 text-[10px]">
                        <div className="flex items-center gap-1 font-bold text-blue-300 text-[10px] mb-0.5">
                          <HelpCircle size={11} className="text-blue-400" />
                          <span>PERGUNTA DO POVO:</span>
                        </div>
                        <p className="text-slate-300 text-[10px] leading-tight italic">
                          &quot;{cand.peopleQuestion}&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ações do Professor */}
                  {isTeacherMode && onPresentCandidate && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/80">
                      {isPresented ? (
                        <button
                          onClick={() => onPresentCandidate(null)}
                          className="w-full py-1.5 px-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
                        >
                          Tirar Destaque da Turma
                        </button>
                      ) : (
                        <button
                          onClick={() => onPresentCandidate(cand.id)}
                          className="w-full py-1.5 px-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles size={13} />
                          <span>Apresentar à Turma</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ========================================================
              VISUALIZAÇÃO MOBILE: Formato Compacto com Seletor Direto
             ======================================================== */}
          <div className="block md:hidden max-w-sm mx-auto">
            {/* Seletor Rápido de Candidato por Abas */}
            <div className="flex items-center gap-1 p-1 bg-[#151124] rounded-xl border border-slate-700 mb-2.5">
              {candidatesList.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setMobileIndex(idx)}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all truncate text-center cursor-pointer ${
                    idx === mobileIndex
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Nº {c.number} {c.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Cartão Mobile Otimizado */}
            <div className="p-3 rounded-xl border-2 border-slate-700 bg-[#221c36] shadow-md">
              {/* Alerta de destaque se estiver apresentado */}
              {activeCandidateId === currentMobileCandidate.id && (
                <div className="mb-2 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles size={11} />
                  <span>Apresentado pelo Professor Agora</span>
                </div>
              )}

              {/* Topo com Foto e Número */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-700/80">
                <div className="flex items-center gap-2 min-w-0">
                  <CandidateAvatar candidateId={currentMobileCandidate.id} size={44} />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold truncate">
                      {currentMobileCandidate.focus}
                    </div>
                    <div className="text-base font-extrabold text-white leading-tight truncate">
                      {currentMobileCandidate.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {currentMobileCandidate.age} anos · {currentMobileCandidate.profession}
                    </div>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xl font-mono shadow shrink-0">
                  {currentMobileCandidate.number}
                </div>
              </div>

              {/* Slogan */}
              <div className="mb-2 px-2 py-1 rounded bg-slate-900/60 border border-slate-700/60 text-[11px] italic text-amber-200">
                &quot;{currentMobileCandidate.slogan}&quot;
              </div>

              {/* Mini Bio */}
              <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                {currentMobileCandidate.bio}
              </p>

              {/* 3 Propostas */}
              <div className="mb-2 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Propostas:
                </div>
                {currentMobileCandidate.proposals.map((prop, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-200 leading-snug">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{prop}</span>
                  </div>
                ))}
              </div>

              {/* Quem paga a conta */}
              <div className="mb-1.5 p-2 rounded-lg bg-red-950/25 border border-red-500/25 text-[10px]">
                <div className="flex items-center gap-1 font-bold text-red-300 text-[10px] mb-0.5">
                  <DollarSign size={11} className="text-red-400" />
                  <span>QUEM PAGA A CONTA:</span>
                </div>
                <p className="text-slate-300 text-[10px] leading-tight">{currentMobileCandidate.whoPays}</p>
              </div>

              {/* Pergunta do povo */}
              <div className="p-2 rounded-lg bg-blue-950/25 border border-blue-500/25 text-[10px]">
                <div className="flex items-center gap-1 font-bold text-blue-300 text-[10px] mb-0.5">
                  <HelpCircle size={11} className="text-blue-400" />
                  <span>PERGUNTA DO POVO:</span>
                </div>
                <p className="text-slate-300 text-[10px] leading-tight italic">
                  &quot;{currentMobileCandidate.peopleQuestion}&quot;
                </p>
              </div>

              {/* Ação do Professor no Mobile */}
              {isTeacherMode && onPresentCandidate && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/80">
                  {activeCandidateId === currentMobileCandidate.id ? (
                    <button
                      onClick={() => onPresentCandidate(null)}
                      className="w-full py-1.5 px-3 text-xs font-bold rounded-lg bg-red-600 text-white cursor-pointer"
                    >
                      Tirar Destaque da Turma
                    </button>
                  ) : (
                    <button
                      onClick={() => onPresentCandidate(currentMobileCandidate.id)}
                      className="w-full py-1.5 px-3 text-xs font-bold rounded-lg bg-emerald-600 text-white flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>Apresentar à Turma</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Setas de navegação */}
            <div className="flex items-center justify-between mt-2 px-1">
              <button
                onClick={() => setMobileIndex(prev => (prev > 0 ? prev - 1 : candidatesList.length - 1))}
                className="p-1.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 active:scale-95"
                aria-label="Candidato anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="text-[11px] text-slate-400">
                {mobileIndex + 1} de {candidatesList.length}
              </span>

              <button
                onClick={() => setMobileIndex(prev => (prev < candidatesList.length - 1 ? prev + 1 : 0))}
                className="p-1.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 active:scale-95"
                aria-label="Próximo candidato"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

        </div>

        {/* Rodapé da Colinha */}
        <div className="px-3.5 py-2.5 bg-[#171324] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="hidden sm:inline">Consulta segura sem perder os números digitados na urna.</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg transition-all cursor-pointer text-xs"
          >
            Voltar para a Votação
          </button>
        </div>

      </div>
    </div>
  );
};
