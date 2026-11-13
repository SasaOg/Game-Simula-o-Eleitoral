import React from 'react';

interface CandidateAvatarProps {
  candidateId: string;
  size?: number;
  className?: string;
  isUrnaScreen?: boolean;
}

export const CandidateAvatar: React.FC<CandidateAvatarProps> = ({
  candidateId,
  size = 64,
  className = '',
  isUrnaScreen = false
}) => {
  // Cores e detalhes em pixel art gerados via SVG vetorial quadriculado
  if (candidateId === '91') {
    // Clara Nogueira: cabelo cacheado preso alto, pele morena clara, camisa social azul/branca e crachá de engenheira
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`shrink-0 image-rendering-pixelated ${className} ${isUrnaScreen ? 'border border-gray-400 bg-white' : 'rounded-md shadow-sm'}`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* Fundo suave */}
        <rect width="32" height="32" fill={isUrnaScreen ? "#EDEDE8" : "#3b82f620"} />
        
        {/* Cabelo cacheado preso em coque volumoso */}
        <rect x="9" y="3" width="14" height="7" fill="#2d1a10" />
        <rect x="7" y="5" width="4" height="6" fill="#1f110a" />
        <rect x="21" y="5" width="4" height="6" fill="#1f110a" />
        <rect x="11" y="1" width="10" height="4" fill="#3d2417" />
        <rect x="8" y="2" width="3" height="3" fill="#3d2417" />
        <rect x="21" y="2" width="3" height="3" fill="#3d2417" />

        {/* Rosto / Pele */}
        <rect x="9" y="8" width="14" height="12" fill="#d49b6a" />
        <rect x="8" y="11" width="2" height="5" fill="#c48a59" /> {/* Orelha esq */}
        <rect x="22" y="11" width="2" height="5" fill="#c48a59" /> {/* Orelha dir */}
        
        {/* Franja cacheada */}
        <rect x="9" y="8" width="14" height="2" fill="#2d1a10" />
        <rect x="13" y="10" width="3" height="2" fill="#2d1a10" />
        <rect x="19" y="10" width="2" height="1" fill="#2d1a10" />

        {/* Olhos amigáveis */}
        <rect x="11" y="12" width="3" height="3" fill="#1e293b" />
        <rect x="12" y="12" width="1" height="1" fill="#ffffff" />
        <rect x="18" y="12" width="3" height="3" fill="#1e293b" />
        <rect x="19" y="12" width="1" height="1" fill="#ffffff" />

        {/* Sobrancelhas */}
        <rect x="11" y="11" width="3" height="1" fill="#1f110a" />
        <rect x="18" y="11" width="3" height="1" fill="#1f110a" />

        {/* Nariz e Sorriso simpático */}
        <rect x="15" y="14" width="2" height="1" fill="#b07647" />
        <rect x="13" y="17" width="6" height="1" fill="#881337" />
        <rect x="14" y="18" width="4" height="1" fill="#ffffff" />

        {/* Pescoço */}
        <rect x="13" y="20" width="6" height="3" fill="#c48a59" />

        {/* Camisa social */}
        <rect x="6" y="23" width="20" height="9" fill="#0284c7" />
        <polygon points="13,23 16,28 19,23" fill="#f8fafc" /> {/* Gola branca */}
        <polygon points="12,23 13,27 16,27" fill="#e2e8f0" />
        <polygon points="20,23 19,27 16,27" fill="#e2e8f0" />

        {/* Crachá no peito */}
        <rect x="8" y="25" width="4" height="5" fill="#f8fafc" />
        <rect x="9" y="26" width="2" height="2" fill="#0284c7" />
        <rect x="9" y="24" width="2" height="1" fill="#64748b" /> {/* Fita crachá */}
      </svg>
    );
  }

  if (candidateId === '92') {
    // Samuel Oliveira: pele negra, cabelo curto preto, jaleco branco de enfermeiro e estetoscópio azul
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`shrink-0 image-rendering-pixelated ${className} ${isUrnaScreen ? 'border border-gray-400 bg-white' : 'rounded-md shadow-sm'}`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        <rect width="32" height="32" fill={isUrnaScreen ? "#EDEDE8" : "#10b98120"} />
        
        {/* Cabelo curto crespo */}
        <rect x="9" y="4" width="14" height="6" fill="#17120e" />
        <rect x="8" y="6" width="16" height="4" fill="#17120e" />

        {/* Rosto / Pele negra com tom quente */}
        <rect x="9" y="8" width="14" height="12" fill="#5c3826" />
        <rect x="8" y="11" width="2" height="4" fill="#4a2c1d" />
        <rect x="22" y="11" width="2" height="4" fill="#4a2c1d" />

        {/* Olhos atenciosos */}
        <rect x="11" y="12" width="3" height="3" fill="#0f172a" />
        <rect x="12" y="12" width="1" height="1" fill="#ffffff" />
        <rect x="18" y="12" width="3" height="3" fill="#0f172a" />
        <rect x="19" y="12" width="1" height="1" fill="#ffffff" />

        {/* Sobrancelhas */}
        <rect x="11" y="10" width="3" height="1" fill="#17120e" />
        <rect x="18" y="10" width="3" height="1" fill="#17120e" />

        {/* Nariz e Sorriso caloroso */}
        <rect x="15" y="14" width="2" height="2" fill="#452718" />
        <rect x="13" y="17" width="6" height="1" fill="#ffffff" />
        <rect x="14" y="18" width="4" height="1" fill="#452718" />

        {/* Pescoço */}
        <rect x="13" y="20" width="6" height="3" fill="#4a2c1d" />

        {/* Jaleco branco de enfermeiro */}
        <rect x="6" y="23" width="20" height="9" fill="#f8fafc" />
        <rect x="15" y="23" width="2" height="9" fill="#cbd5e1" /> {/* Linha central botões */}

        {/* Estetoscópio azul em volta do pescoço */}
        <rect x="10" y="22" width="2" height="6" fill="#0284c7" />
        <rect x="20" y="22" width="2" height="6" fill="#0284c7" />
        <rect x="12" y="21" width="8" height="2" fill="#0284c7" />
        <rect x="19" y="27" width="3" height="3" fill="#94a3b8" /> {/* Diafragma metálico */}
      </svg>
    );
  }

  if (candidateId === '93') {
    // Osvaldo Ribeiro: mestre de obras aposentado, boné de obra amarelo/laranja, cabelo grisalho, bigode marcante
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`shrink-0 image-rendering-pixelated ${className} ${isUrnaScreen ? 'border border-gray-400 bg-white' : 'rounded-md shadow-sm'}`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        <rect width="32" height="32" fill={isUrnaScreen ? "#EDEDE8" : "#f59e0b20"} />
        
        {/* Boné de obra amarelo mostarda */}
        <rect x="8" y="3" width="16" height="6" fill="#eab308" />
        <rect x="7" y="7" width="18" height="3" fill="#ca8a04" />
        <rect x="5" y="9" width="10" height="2" fill="#a16207" /> {/* Aba do boné */}

        {/* Cabelo grisalho nas laterais */}
        <rect x="8" y="9" width="2" height="5" fill="#94a3b8" />
        <rect x="22" y="9" width="2" height="5" fill="#94a3b8" />
        <rect x="7" y="11" width="2" height="3" fill="#cbd5e1" />

        {/* Rosto / Pele clara com rugas de expressão simpáticas */}
        <rect x="9" y="10" width="14" height="11" fill="#e2a97b" />

        {/* Olhos com pés de galinha amigáveis */}
        <rect x="11" y="12" width="3" height="2" fill="#1e293b" />
        <rect x="12" y="12" width="1" height="1" fill="#ffffff" />
        <rect x="18" y="12" width="3" height="2" fill="#1e293b" />
        <rect x="19" y="12" width="1" height="1" fill="#ffffff" />
        <rect x="8" y="12" width="2" height="1" fill="#c68a5c" />
        <rect x="22" y="12" width="2" height="1" fill="#c68a5c" />

        {/* Bigode marcante grisalho */}
        <rect x="11" y="16" width="10" height="3" fill="#94a3b8" />
        <rect x="13" y="16" width="6" height="2" fill="#64748b" />
        <rect x="14" y="19" width="4" height="1" fill="#854d0e" /> {/* Sorriso sob o bigode */}

        {/* Pescoço */}
        <rect x="13" y="21" width="6" height="2" fill="#c68a5c" />

        {/* Camisa xadrez/polo trabalhadora */}
        <rect x="6" y="23" width="20" height="9" fill="#b45309" />
        <rect x="10" y="23" width="2" height="9" fill="#d97706" />
        <rect x="20" y="23" width="2" height="9" fill="#d97706" />
        <rect x="6" y="27" width="20" height="2" fill="#d97706" />
      </svg>
    );
  }

  // Fallback genérico para candidato inexistente ou nulo
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex items-center justify-center bg-gray-200 border border-gray-400 text-gray-500 font-bold ${className}`}
    >
      ?
    </div>
  );
};
