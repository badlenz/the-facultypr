import React, { useState, useEffect, useRef } from 'react';

export interface CinematicPortalHeroProps {
  onEnterStudio?: () => void;
  brandName?: string;
}

export const CinematicPortalHero: React.FC<CinematicPortalHeroProps> = ({
  onEnterStudio,
  brandName = 'LA FACULTAD'
}) => {
  const [isSceneMode, setIsSceneMode] = useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  // Video and Poster Assets from Dinamo Sites Reference
  const VIDEO_SRC = 'https://media.dinamosites.com/library/v1/sections/cinematic-portal-be07fdbb3c13.mp4';
  const POSTER_SRC = 'https://dinamosites.com/demos/cinematic-heroes-v1/media/portal.jpg';

  // Manejo de teclado (Escape restaura el contenido)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSceneMode) {
        setIsSceneMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSceneMode]);

  // Manejo de 'prefers-reduced-motion' y pausa fuera de pantalla (IntersectionObserver)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const video = videoRef.current;

    if (mediaQuery.matches && video) {
      video.pause();
    }

    if (!heroRef.current || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!mediaQuery.matches) {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const handleToggleScene = () => {
    setIsSceneMode(prev => !prev);
  };

  const handleCrossPortal = () => {
    // Si se pasa función para entrar al estudio, o despejar la escena
    if (onEnterStudio) {
      onEnterStudio();
    } else {
      setIsSceneMode(true);
    }
  };

  return (
    <section 
      ref={heroRef}
      className="relative w-full min-h-screen min-h-[100dvh] bg-[#05070d] text-white overflow-hidden flex flex-col justify-between select-none"
      aria-label="Portal Cinematográfico"
    >
      {/* 1. VIDEO DE FONDO CINEMATOGRÁFICO EN LOOP */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`w-full h-full object-cover object-center scale-[1.02] transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-80'
          }`}
          aria-hidden="true"
        />

        {/* Gradiente sutil para garantizar legibilidad del H1 y preservando el arco de cobre y nubes */}
        <div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/50 via-transparent to-black/85" 
          aria-hidden="true"
        />
        {/* Viñeta cinematográfica periférica */}
        <div 
          className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" 
          aria-hidden="true"
        />
      </div>

      {/* 2. CABECERA LIMPIA: MARCA Y NAVEGACIÓN SENCILLA */}
      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-14 py-6 sm:py-8 flex items-center justify-between">
        {/* Marca (Syne 700) */}
        <div className="flex items-center gap-2">
          <span className="font-syne font-bold text-lg sm:text-xl tracking-wider text-white uppercase drop-shadow-md">
            {brandName}
          </span>
        </div>

        {/* Navegación sencilla sin decoraciones pequeñas ni líneas divisorias */}
        <nav className="flex items-center gap-3 sm:gap-4 font-dmsans text-sm">
          {isSceneMode ? (
            <button
              type="button"
              onClick={() => setIsSceneMode(false)}
              className="portal-glass-secondary px-4 py-2 rounded-full text-white text-xs sm:text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-white/80 focus:outline-none cursor-pointer"
            >
              Volver al inicio
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleScene}
              className="portal-glass-secondary px-4 py-2 rounded-full text-white/90 hover:text-white text-xs sm:text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-white/80 focus:outline-none cursor-pointer"
            >
              Ver escena
            </button>
          )}

          {onEnterStudio && (
            <button
              type="button"
              onClick={onEnterStudio}
              className="hidden sm:inline-flex portal-glass-secondary px-4 py-2 rounded-full text-white/90 hover:text-white text-xs sm:text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-white/80 focus:outline-none cursor-pointer"
            >
              Estudio Badlenz
            </button>
          )}
        </nav>
      </header>

      {/* 3. CENTRO CINEMATOGRÁFICO: EL PROTAGONISTA (ARCO DE CERÁMICA AZUL, COBRE Y NUBES) */}
      <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none">
        {/* Espacio reservado para permitir que el arco monumental respire en el centro de la pantalla */}
      </div>

      {/* 4. COMPOSICIÓN INFERIOR COMPACTA: H1, SUBTÍTULO Y BOTÓN EN COLUMNA CENTRADA */}
      <div className="relative z-20 w-full px-4 sm:px-8 pb-12 sm:pb-16 pt-4 flex flex-col items-center text-center">
        {/* Contenedor animado que se despeja en 'Modo Escena' */}
        <div 
          className={`flex flex-col items-center text-center max-w-4xl mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSceneMode 
              ? 'opacity-0 translate-y-8 pointer-events-none scale-95' 
              : 'opacity-100 translate-y-0 pointer-events-auto scale-100'
          }`}
        >
          {/* TÍTULO COMPACTO: clamp(62px,6.9vw,118px), interlineado .89, tracking -.065em */}
          <h1 className="portal-hero-title text-white uppercase text-balance drop-shadow-2xl">
            Cruza a otro mundo.
          </h1>

          {/* SUBTÍTULO: 21–26px escritorio, 20px móvil (DM Sans 400/500) */}
          <p className="font-dmsans font-normal text-[20px] sm:text-[23px] md:text-[26px] text-white/90 mt-3 sm:mt-4 leading-tight tracking-tight max-w-xl text-balance drop-shadow">
            Un nuevo punto de partida.
          </p>

          {/* BOTÓN CRISTAL AZULADO TRANSLÚCIDO: blur 18px, borde blanco fino, reflejo interior, altura 60-66px */}
          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleCrossPortal}
              className="portal-glass-button h-[62px] min-h-[60px] max-h-[66px] px-9 sm:px-12 rounded-full font-dmsans font-medium text-white text-base sm:text-lg flex items-center justify-center text-center tracking-normal focus-visible:ring-2 focus-visible:ring-white/80 focus:outline-none active:scale-[0.98] cursor-pointer"
            >
              Cruzar el portal
            </button>
          </div>
        </div>

        {/* MODO ESCENA ACTIVO: Indicador discreto para restaurar */}
        {isSceneMode && (
          <div className="animate-fadeIn transition-all duration-500 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSceneMode(false)}
              className="portal-glass-button h-[54px] px-8 rounded-full font-dmsans font-medium text-white text-sm sm:text-base flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white/80 focus:outline-none cursor-pointer shadow-2xl"
            >
              Volver al inicio
            </button>
            <span className="font-dmsans text-[11px] text-white/60 tracking-wide mt-1">
              Presiona <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/90 font-mono text-[10px]">Esc</kbd> para restaurar
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default CinematicPortalHero;
