import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, Smartphone, ExternalLink, Globe } from 'lucide-react';
import { getPublicStudentUrl, getAlternateSharedUrl } from '../utils/url';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [usePublicShareLink, setUsePublicShareLink] = useState<boolean>(true);

  const directStudentUrl = getPublicStudentUrl();
  const alternatePublicUrl = getAlternateSharedUrl('aluno');

  // URL ativa para gerar o QR code e o link de envio
  const activeUrl = (usePublicShareLink && alternatePublicUrl) ? alternatePublicUrl : directStudentUrl;

  useEffect(() => {
    if (!isOpen || !activeUrl) return;

    QRCode.toDataURL(activeUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR Code:', err));
  }, [isOpen, activeUrl]);

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = textToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#221c36] border-2 border-amber-400 rounded-2xl shadow-2xl overflow-hidden p-6 text-center max-h-[95vh] overflow-y-auto">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          aria-label="Fechar QR Code"
        >
          <X size={18} />
        </button>

        {/* Título & Instrução */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <QrCode className="text-amber-400" size={26} />
          <h2 className="text-xl font-bold text-white font-pixel tracking-wider">
            ACESSO DOS ALUNOS
          </h2>
        </div>
        <p className="text-xs text-slate-300 mb-4">
          Aponte a câmera do celular para votar na urna eletrônica
        </p>

        {/* Toggle para alternar entre link de compartilhamento e link local */}
        {alternatePublicUrl && (
          <div className="mb-4 p-1.5 bg-[#151124] border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs">
            <button
              onClick={() => setUsePublicShareLink(true)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                usePublicShareLink
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Link Público (Sem Login)
            </button>
            <button
              onClick={() => setUsePublicShareLink(false)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                !usePublicShareLink
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Link Atual da Janela
            </button>
          </div>
        )}

        {/* Bloco Branco com QR Code Grande para Leitura Fácil na Transmissão de Vídeo */}
        <div className="bg-white p-3.5 rounded-xl inline-block shadow-lg border-4 border-amber-400/80 mb-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code de acesso para os alunos"
              className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto"
            />
          ) : (
            <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-slate-400 text-xs font-mono">
              Gerando QR Code...
            </div>
          )}
        </div>

        {/* Dica para a Aula Online */}
        <div className="p-3 bg-[#151124] rounded-xl border border-slate-700 text-xs text-slate-300 mb-4 flex items-start gap-2 text-left">
          <Smartphone size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            Os alunos acessam pelo celular <strong>sem precisar criar conta ou fazer login</strong>. Apenas colocam um apelido e aguardam o voto!
          </span>
        </div>

        {/* Caixa com o Link Direto e Botão de Copiar */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left flex items-center justify-between">
            <span>Link para enviar no chat da aula:</span>
            {usePublicShareLink && alternatePublicUrl && (
              <span className="text-[10px] text-emerald-400 font-bold lowercase flex items-center gap-1">
                <Globe size={11} /> público para celulares
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-[#120f1e] border border-slate-700 rounded-lg">
            <input
              type="text"
              readOnly
              value={activeUrl}
              className="flex-1 bg-transparent px-2 text-xs text-amber-200 outline-none truncate font-mono select-all"
            />
            <button
              onClick={() => handleCopy(activeUrl)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ação secundária: Abrir em nova aba para teste */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-amber-300 inline-flex items-center gap-1 underline text-[11px]"
          >
            <ExternalLink size={12} />
            <span>Testar em nova aba</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer text-xs"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    </div>
  );
};
