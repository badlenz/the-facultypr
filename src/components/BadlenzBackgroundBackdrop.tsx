import React, { useState } from 'react';

export interface BadlenzBackgroundBackdropProps {
  /** Ruta personalizada del logo Badlenz */
  logoSrc?: string;
  /** Opacidad base de la marca de agua */
  opacity?: number;
}

export const BadlenzBackgroundBackdrop: React.FC<BadlenzBackgroundBackdropProps> = ({
  logoSrc = '/logo-badlenz.png',
  opacity = 0.06,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* Resplandor atmosférico rojo (CSS puro, ligero para GPU móvil) */}
      <div className="hidden sm:block absolute w-[680px] h-[680px] lg:w-[860px] lg:h-[860px] rounded-full bg-red-600/10 blur-[140px] pointer-events-none animate-ambient-pulse" />

      {/* Halo secundario cálido ámbar */}
      <div
        className="hidden sm:block absolute w-[460px] h-[460px] rounded-full bg-amber-500/8 blur-[120px] pointer-events-none animate-ambient-pulse"
        style={{ animationDelay: '3s' }}
      />

      {/* Marca de agua Badlenz fija y ligera */}
      {!imgError && (
        <div
          className="relative w-[300px] h-[300px] sm:w-[460px] sm:h-[460px] md:w-[560px] md:h-[560px] flex items-center justify-center"
          style={{ opacity }}
        >
          <img
            src={logoSrc}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(220,38,38,0.2)]"
          />
        </div>
      )}
    </div>
  );
};

export default BadlenzBackgroundBackdrop;
