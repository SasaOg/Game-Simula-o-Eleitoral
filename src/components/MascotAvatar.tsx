import React from 'react';

interface MascotAvatarProps {
  size?: number;
  className?: string;
  mood?: 'happy' | 'explaining' | 'solemn' | 'celebrating';
}

export const MascotAvatar: React.FC<MascotAvatarProps> = ({
  size = 56,
  className = '',
  mood = 'explaining',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`shrink-0 image-rendering-pixelated ${className}`}
      style={{ shapeRendering: 'crispEdges' }}
    >
      {/* Halo ou fundo de destaque */}
      <circle cx="16" cy="16" r="15" fill="#facc1520" stroke="#facc15" strokeWidth="1" strokeDasharray="2 2" />

      {/* Cabelo roxo/índigo escuro elegante com tiara dourada de justiça */}
      <rect x="9" y="3" width="14" height="6" fill="#312e81" />
      <rect x="7" y="5" width="4" height="12" fill="#312e81" />
      <rect x="21" y="5" width="4" height="12" fill="#312e81" />
      <rect x="11" y="2" width="10" height="2" fill="#4338ca" />
      
      {/* Tiara dourada da balança/juíza */}
      <rect x="12" y="4" width="8" height="2" fill="#eab308" />
      <rect x="15" y="2" width="2" height="2" fill="#fde047" />

      {/* Rosto */}
      <rect x="10" y="8" width="12" height="11" fill="#fed7aa" />
      <rect x="9" y="11" width="1" height="3" fill="#fdba74" />
      <rect x="22" y="11" width="1" height="3" fill="#fdba74" />

      {/* Olhos estilo anime/pixel novel */}
      <rect x="12" y="11" width="2" height="3" fill="#1e1b4b" />
      <rect x="12" y="11" width="1" height="1" fill="#ffffff" />
      <rect x="18" y="11" width="2" height="3" fill="#1e1b4b" />
      <rect x="18" y="11" width="1" height="1" fill="#ffffff" />

      {/* Bochechas coradas */}
      <rect x="10" y="13" width="2" height="1" fill="#fb7185" />
      <rect x="20" y="13" width="2" height="1" fill="#fb7185" />

      {/* Boca amigável */}
      {mood === 'celebrating' ? (
        <rect x="14" y="15" width="4" height="2" fill="#be123c" />
      ) : mood === 'solemn' ? (
        <rect x="14" y="15" width="4" height="1" fill="#9a3412" />
      ) : (
        <rect x="14" y="15" width="4" height="1" fill="#c2410c" />
      )}

      {/* Toga preta de magistrada */}
      <rect x="6" y="21" width="20" height="11" fill="#0f172a" />
      {/* Babado/gola branca clássica de juiz */}
      <polygon points="12,21 16,26 20,21" fill="#f8fafc" />
      <rect x="15" y="21" width="2" height="5" fill="#e2e8f0" />

      {/* Martelo de juíza (gavel) pixel art ao lado */}
      <rect x="24" y="19" width="3" height="4" fill="#854d0e" />
      <rect x="25" y="23" width="1" height="6" fill="#a16207" />
    </svg>
  );
};
