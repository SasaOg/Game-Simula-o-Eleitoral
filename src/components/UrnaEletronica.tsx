import React, { useState } from 'react';
import { CANDIDATES } from '../data/candidates';
import { CandidateAvatar } from './CandidateAvatar';
import { audioSystem } from '../utils/audio';

interface UrnaEletronicaProps {
  onVoteSubmitted: (vote: string) => Promise<void>;
  activeCandidates?: string[];
  currentRound?: 1 | 2;
  disabled?: boolean;
}

export const UrnaEletronica: React.FC<UrnaEletronicaProps> = ({
  onVoteSubmitted,
  activeCandidates = ['91', '92', '93'],
  currentRound = 1,
  disabled = false,
}) => {
  const [digits, setDigits] = useState<string>('');
  const [isBranco, setIsBranco] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  // Manipulação de dígitos numéricos
  const handleDigitPress = (digit: string) => {
    if (disabled || isSubmitting || hasVoted || isBranco) return;
    if (digits.length >= 2) return;

    audioSystem.playKeyBeep();
    setDigits(prev => prev + digit);
  };

  // Tecla BRANCO
  const handleBrancoPress = () => {
    if (disabled || isSubmitting || hasVoted) return;
    if (digits.length > 0) return; // Tecla branco só funciona com campo vazio

    audioSystem.playKeyBeep();
    setIsBranco(true);
  };

  // Tecla CORRIGE
  const handleCorrigePress = () => {
    if (disabled || isSubmitting || hasVoted) return;

    audioSystem.playKeyBeep();
    setDigits('');
    setIsBranco(false);
  };

  // Tecla CONFIRMA
  const handleConfirmaPress = async () => {
    if (disabled || isSubmitting || hasVoted) return;

    let voteValue = '';
    if (isBranco) {
      voteValue = 'branco';
    } else if (digits.length === 2) {
      // Verifica se é candidato ativo
      if (activeCandidates.includes(digits) && CANDIDATES[digits]) {
        voteValue = digits;
      } else {
        voteValue = 'nulo';
      }
    } else {
      // Voto incompleto não confirma
      return;
    }

    setIsSubmitting(true);
    setHasVoted(true);

    // Toca som oficial de confirmação
    await audioSystem.playConfirmSound();

    try {
      await onVoteSubmitted(voteValue);
    } catch (err) {
      console.error('Erro ao enviar voto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Identificação do candidato digitado
  const candidate = digits.length === 2 && activeCandidates.includes(digits) ? CANDIDATES[digits] : null;
  const isCandidatoInexistente = digits.length === 2 && !candidate && !isBranco;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Gabinete da Urna: #D8D6CE com cantos arredondados e sombra realística */}
      <div
        className="rounded-2xl p-4 sm:p-7 shadow-2xl border-4 border-[#b8b5aa] transition-all"
        style={{
          backgroundColor: '#D8D6CE',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
        }}
      >
        {/* Layout: Em desktop tela à esquerda e teclado à direita; Em mobile tela em cima e teclado embaixo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 items-stretch">
          
          {/* ========================================================
              TELA DA URNA (À esquerda no desktop, acima no mobile)
             ======================================================== */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#F4F4F0] text-black font-urna rounded-xl border-4 border-[#9c998e] shadow-inner p-4 sm:p-6 min-h-[360px] sm:min-h-[420px] select-none">
            
            {/* ESTADO 1: TELA FIM / VOTO REGISTRADO */}
            {hasVoted ? (
              <div className="flex-1 flex flex-col justify-between py-6 animate-in zoom-in-95 duration-200">
                <div className="text-center text-xs tracking-wider text-gray-500 font-bold uppercase">
                  SIMULAÇÃO EDUCATIVA · VILA ESPERANÇA
                </div>

                <div className="text-center my-auto">
                  <div className="text-6xl sm:text-8xl font-black tracking-widest text-black my-2">
                    FIM
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-700 bg-emerald-100 py-2 px-4 rounded-lg inline-block border border-emerald-300 shadow-sm mt-3">
                    ✓ Seu voto foi registrado com sucesso!
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 border-t border-gray-300 pt-3">
                  <span>Eleição {currentRound}º Turno</span>
                  <span className="text-right text-sm font-black tracking-widest">VOTOU</span>
                </div>
              </div>
            ) : isBranco ? (
              /* ESTADO 2: VOTO EM BRANCO */
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    SEU VOTO PARA
                  </div>
                  <div className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900 mb-4">
                    Prefeito(a)
                  </div>

                  <div className="py-12 sm:py-16 text-center">
                    <div className="text-2xl sm:text-4xl font-black tracking-wider text-gray-900 border-2 border-dashed border-gray-400 py-6 px-4 bg-white/60 rounded">
                      VOTO EM BRANCO
                    </div>
                  </div>
                </div>

                {/* Rodapé Fixo */}
                <div className="border-t-2 border-gray-400 pt-2 text-[11px] sm:text-xs text-gray-800 leading-tight">
                  <div className="font-bold mb-0.5">Aperte a tecla:</div>
                  <div className="text-gray-900 font-semibold">
                    <span className="text-emerald-800 font-bold">CONFIRMA</span> para CONFIRMAR este voto
                  </div>
                  <div className="text-gray-900 font-semibold">
                    <span className="text-orange-800 font-bold">CORRIGE</span> para REINICIAR este voto
                  </div>
                </div>
              </div>
            ) : (
              /* ESTADO 3: DIGITAÇÃO DE DÍGITOS OU CANDIDATO / NULO */
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    SEU VOTO PARA
                  </div>
                  <div className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900 mb-3">
                    Prefeito(a)
                  </div>

                  {/* Campo Número com 2 caixinhas quadradas */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-bold text-gray-700">Número:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-12 sm:w-11 sm:h-14 border-2 border-black bg-white flex items-center justify-center text-2xl sm:text-3xl font-bold font-mono shadow-inner">
                        {digits[0] || (digits.length === 0 ? <span className="cursor-blink text-gray-400">|</span> : '')}
                      </div>
                      <div className="w-10 h-12 sm:w-11 sm:h-14 border-2 border-black bg-white flex items-center justify-center text-2xl sm:text-3xl font-bold font-mono shadow-inner">
                        {digits[1] || (digits.length === 1 ? <span className="cursor-blink text-gray-400">|</span> : '')}
                      </div>
                    </div>
                  </div>

                  {/* Informações do Candidato Válido */}
                  {candidate && (
                    <div className="flex items-start justify-between gap-3 p-3 bg-white/80 border border-gray-300 rounded-lg shadow-sm animate-in fade-in duration-150">
                      <div className="flex-1 space-y-1">
                        <div>
                          <span className="text-xs text-gray-500 font-bold uppercase mr-1">Nome:</span>
                          <span className="text-base sm:text-lg font-bold text-gray-900">{candidate.name}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 font-bold uppercase mr-1">Foco:</span>
                          <span className="text-xs sm:text-sm font-semibold text-blue-800 uppercase">{candidate.focus}</span>
                        </div>
                        <div className="text-xs text-gray-600 italic">
                          &quot;{candidate.slogan}&quot;
                        </div>
                      </div>

                      {/* Avatar oficial na tela da urna */}
                      <div className="text-center shrink-0">
                        <CandidateAvatar candidateId={candidate.id} size={64} isUrnaScreen />
                        <span className="text-[10px] text-gray-500 font-bold block mt-0.5">FOTO</span>
                      </div>
                    </div>
                  )}

                  {/* Candidato Inexistente / Voto Nulo */}
                  {isCandidatoInexistente && (
                    <div className="p-4 bg-white/80 border-2 border-red-500 rounded-lg text-center animate-in shake duration-200">
                      <div className="text-sm font-bold text-red-600 uppercase tracking-wide">
                        CANDIDATO INEXISTENTE
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-red-800 tracking-wider my-1">
                        VOTO NULO
                      </div>
                      <div className="text-xs text-gray-600">
                        {currentRound === 2 ? 'Este número não está no 2º turno.' : 'Número não corresponde a nenhum candidato.'}
                      </div>
                    </div>
                  )}

                  {/* Orientações quando ainda não digitou os 2 dígitos */}
                  {digits.length < 2 && (
                    <div className="py-6 text-center text-xs text-gray-500 italic">
                      Digite os 2 números do(a) seu(sua) candidato(a) no teclado abaixo.
                    </div>
                  )}
                </div>

                {/* Rodapé Fixo da Urna */}
                <div className="border-t-2 border-gray-400 pt-2 text-[11px] sm:text-xs text-gray-800 leading-tight mt-4">
                  <div className="font-bold mb-0.5">Aperte a tecla:</div>
                  <div className="text-gray-900 font-semibold">
                    <span className="text-emerald-800 font-bold">CONFIRMA</span> para CONFIRMAR este voto
                  </div>
                  <div className="text-gray-900 font-semibold">
                    <span className="text-orange-800 font-bold">CORRIGE</span> para REINICIAR este voto
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================
              TECLADO DA URNA (À direita no desktop, abaixo no mobile)
             ======================================================== */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#1A1A1A] rounded-xl p-4 sm:p-5 shadow-2xl border-2 border-[#111]">
            
            {/* Topo do Teclado: Emblema Educativo e Identificação */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2">
                {/* Emblema genérico inventado com urna e louros pedagógicos */}
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                  <path d="M4 7V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V7M2 7H22M12 3L16 7M12 3L8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="14" r="2" fill="currentColor"/>
                </svg>
                <span className="text-xs font-bold text-gray-200 tracking-wider uppercase font-pixel">
                  SIMULAÇÃO EDUCATIVA
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">TURNO {currentRound}</span>
            </div>

            {/* Grade Numérica: 1 2 3 / 4 5 6 / 7 8 9 / e 0 centralizado */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => handleDigitPress(num)}
                  disabled={hasVoted || isSubmitting}
                  className="urna-key-num relative h-12 sm:h-13 rounded-lg flex items-center justify-center text-white font-bold text-xl sm:text-2xl font-mono cursor-pointer active:scale-95 disabled:opacity-50"
                  aria-label={`Número ${num}`}
                >
                  {num}
                  {/* Pontinho tátil em relevo na tecla 5 */}
                  {num === '5' && (
                    <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 pointer-events-none" />
                  )}
                </button>
              ))}

              {/* Linha do 0 (coluna vazia, 0 centralizado, coluna vazia) */}
              <div aria-hidden="true" />
              <button
                onClick={() => handleDigitPress('0')}
                disabled={hasVoted || isSubmitting}
                className="urna-key-num h-12 sm:h-13 rounded-lg flex items-center justify-center text-white font-bold text-xl sm:text-2xl font-mono cursor-pointer active:scale-95 disabled:opacity-50"
                aria-label="Número 0"
              >
                0
              </button>
              <div aria-hidden="true" />
            </div>

            {/* Fileira Inferior de Teclas de Ação: BRANCO, CORRIGE, CONFIRMA */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-2 border-t border-[#2e2e2e]">
              {/* Tecla BRANCO */}
              <button
                onClick={handleBrancoPress}
                disabled={hasVoted || isSubmitting || digits.length > 0}
                className="urna-key-branco h-13 sm:h-14 rounded-lg flex flex-col items-center justify-center font-bold text-[11px] sm:text-xs text-gray-900 tracking-wider uppercase cursor-pointer disabled:opacity-40"
              >
                <span>BRANCO</span>
              </button>

              {/* Tecla CORRIGE */}
              <button
                onClick={handleCorrigePress}
                disabled={hasVoted || isSubmitting}
                className="urna-key-corrige h-13 sm:h-14 rounded-lg flex flex-col items-center justify-center font-bold text-[11px] sm:text-xs text-gray-950 tracking-wider uppercase cursor-pointer disabled:opacity-40"
              >
                <span>CORRIGE</span>
              </button>

              {/* Tecla CONFIRMA (verde maior) */}
              <button
                onClick={handleConfirmaPress}
                disabled={hasVoted || isSubmitting || (!isBranco && digits.length !== 2)}
                className="urna-key-confirma h-14 sm:h-15 rounded-lg flex flex-col items-center justify-center font-black text-xs sm:text-sm text-gray-950 tracking-wider uppercase cursor-pointer disabled:opacity-30 disabled:grayscale"
              >
                <span>CONFIRMA</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
