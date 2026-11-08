import React, { useState, useEffect, useRef, useId } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles, Calendar, ChevronRight, Music, Headphones, Volume2 } from 'lucide-react';

export interface HeroProps {
  /** Acción al presionar el CTA principal "Reservar Sesión" */
  onBookSession?: () => void;
  /** Acción al presionar el CTA secundario "Ver Servicios" */
  onExploreServices?: () => void;
  /** Ruta personalizada del logo (por defecto toma el escudo de la carpeta pública) */
  logoSrc?: string;
  /** Nombre del estudio o marca */
  brandName?: string;
}

export const Hero: React.FC<HeroProps> = ({
  onBookSession,
  onExploreServices,
  logoSrc = '/logo faculty .png',
  brandName = 'La Facultad Studio'
}) => {
  // Referencia al contenedor Hero para calcular coordenadas relativas del cursor
  const heroRef = useRef<HTMLElement | null>(null);

  // Estados de interacción para el resplandor reactivo
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const [isCtaHovered, setIsCtaHovered] = useState<boolean>(false);
  const isInteracting = isLogoHovered || isCtaHovered;

  // Detección de dispositivos táctiles o móviles
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 
        typeof window !== 'undefined' && 
        (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
      setIsTouchDevice(hasTouch);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);
    // Codificación segura para CSS masks con nombres de archivo que contienen espacios
  const safeMaskLogo = typeof window !== 'undefined' ? encodeURI(logoSrc) : logoSrc;

  return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Motion Values para Mouse Tracking relativo (-1 a 1)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Configuración de resortes físicos para sensación de inercia y peso cinematográfico
  const springConfig = { stiffness: 150, damping: 20 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Mapeo a rotación 3D sutil (entre -12deg y 12deg)
  const rotateX = useTransform(smoothY, [-1, 1], [12, -12]);
  const rotateY = useTransform(smoothX, [-1, 1], [-12, 12]);

  // Desplazamiento sutil de sombras y profundidad
  const shadowX = useTransform(smoothX, [-1, 1], [15, -15]);
  const shadowY = useTransform(smoothY, [-1, 1], [15, -15]);

  // Manejo de movimiento del mouse sobre el héroe
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (isTouchDevice || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalizado entre -1 y 1
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(Math.max(-1, Math.min(1, x)));
    mouseY.set(Math.max(-1, Math.min(1, y)));
  };

  // Restaurar inclinación al salir el cursor
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsLogoHovered(false);
  };

  // Acciones predeterminadas de scroll suave si no se proporcionan callbacks externos
  const handleDefaultBook = () => {
    if (onBookSession) {
      onBookSession();
    } else {
      const target = 
        document.getElementById('seccion-calendario-booking') || 
        document.getElementById('tarifas-estudio');
      target?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDefaultServices = () => {
    if (onExploreServices) {
      onExploreServices();
    } else {
      const target = 
        document.getElementById('tarifas-estudio') || 
        document.getElementById('muestras-audio');
      target?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Codificación segura para CSS masks con nombres de archivo que contienen espacios
  const safeMaskLogo = typeof window !== 'undefined' ? encodeURI(logoSrc) : logoSrc;

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[92vh] sm:min-h-screen bg-[#0a0a0a]/85 backdrop-blur-[2px] text-white overflow-hidden flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 select-none"
      style={{ perspective: 1200 }}
      aria-label="Presentación Principal The Faculty"
    >
      {/* =========================================================================
          1. FONDO ATMOSFÉRICO Y RESPLANDOR REACTIVO
      ========================================================================= */}
      {/* Cuadrícula sutil de estudio con gradiente radial */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" 
        aria-hidden="true"
      />

      {/* Glow rojo reactivo atmosférico detrás del logo (aumenta escala y opacidad con interacción) */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] md:w-[620px] md:h-[620px] bg-red-600/15 blur-[120px] rounded-full pointer-events-none"
        animate={{
          scale: isInteracting ? 1.28 : 1.0,
          opacity: isInteracting ? 0.35 : 0.18,
        }}
        transition={{
          duration: 0.7,
          ease: [0.16, 1, 0.3, 1],
        }}
        aria-hidden="true"
      />

      {/* Halo secundario cálido ámbar/cobre para acento analógico de consola de audio */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] sm:w-[320px] sm:h-[320px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"
        animate={{
          scale: isInteracting ? 1.15 : 0.95,
          opacity: isInteracting ? 0.22 : 0.10,
        }}
        transition={{
          duration: 0.8,
          ease: 'easeOut',
        }}
        aria-hidden="true"
      />

      {/* =========================================================================
          2. CONTENIDO PRINCIPAL CENTRADO
      ========================================================================= */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center">

        {/* Badge superior: Status en vivo / Ubicación */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800/90 shadow-lg mb-8 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-zinc-300">
            {brandName} <span className="text-zinc-600">·</span> Hormigueros, PR
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-950/60 border border-red-800/50 text-red-300 font-bold">
            PRO STUDIO
          </span>
        </motion.div>

        {/* =======================================================================
            3. LOGO 3D INTERACTIVO CON MOVIMIENTO CINEMATOGRÁFICO Y SHEEN METÁLICO
        ======================================================================= */}
        <div className="relative my-2 sm:my-4 flex items-center justify-center">
          <motion.div
            style={
              isTouchDevice
                ? {}
                : {
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                  }
            }
            animate={
              isTouchDevice
                ? {
                    // Modo móvil: Animación de respiración / levitación vertical suave de +/- 6px
                    y: [-6, 6, -6],
                  }
                : {}
            }
            transition={
              isTouchDevice
                ? {
                    repeat: Infinity,
                    duration: 4.5,
                    ease: 'easeInOut',
                  }
                : undefined
            }
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            className="relative cursor-pointer group rounded-2xl"
          >
            {/* Contenedor responsivo del logo (280px a 380px según pantalla) */}
            <div className="relative w-[280px] h-[280px] sm:w-[330px] sm:h-[330px] md:w-[380px] md:h-[380px] flex items-center justify-center p-3">
              
              {/* Sombra de proyección dinámica detrás del escudo */}
              <motion.div
                className="absolute inset-4 rounded-full bg-black/60 blur-2xl pointer-events-none -z-10"
                style={
                  !isTouchDevice
                    ? {
                        x: shadowX,
                        y: shadowY,
                      }
                    : undefined
                }
              />

              {/* Logo Escudo Principal (The Faculty Shield) */}
              <img
                src={logoSrc}
                alt="The Faculty Shield Logo"
                draggable={false}
                onError={(e) => {
                  // Fallbacks robustos en caso de variación de codificación de URL
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback1) {
                    target.dataset.triedFallback1 = 'true';
                    target.src = '/logo-faculty.png';
                  } else if (!target.dataset.triedFallback2) {
                    target.dataset.triedFallback2 = 'true';
                    target.src = '/logo%20faculty%20.png';
                  } else {
                    target.src = '/assets/branding/the-faculty-crest-hd.jpg';
                  }
                }}
                className="w-full h-full object-contain filter drop-shadow-[0_20px_45px_rgba(220,38,38,0.35)] transition-transform duration-500 group-hover:scale-[1.03]"
              />

              {/* =================================================================
                  EFECTO DE BRILLO METÁLICO (METALLIC SHEEN SWEEP)
                  Se proyecta exactamente a través de una máscara que respeta la forma
                  del logo para evitar cajas rectangulares, cruzando cada 4 a 6 segundos.
              ================================================================= */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
                style={{
                  maskImage: `url("${safeMaskLogo}"), url("/logo-faculty.png")`,
                  WebkitMaskImage: `url("${safeMaskLogo}"), url("/logo-faculty.png")`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              >
                <motion.div
                  className="w-[200%] h-full absolute inset-y-0"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                    mixBlendMode: 'screen',
                  }}
                  animate={{
                    x: ['-120%', '120%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8,
                    repeatDelay: 4.2, // Intervalo cíclico entre 4 y 6 segundos
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </div>

              {/* Anillo de resplandor sutil periférico */}
              <div className="absolute inset-0 rounded-full border border-red-500/10 pointer-events-none scale-105 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            4. TÍTULOS Y DESCRIPCIÓN CINEMATOGRÁFICA
        ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="space-y-4 max-w-3xl mt-4"
        >
          {/* Título Monumental con degradado de audio profesional */}
          <h1 className="font-syne font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight leading-[0.95] text-white">
            Tu sonido al nivel{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">
              que tu música exige.
            </span>
          </h1>

          {/* Subtítulo enfocado en credibilidad y valor de producción */}
          <p className="font-dmsans text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Grabación vocal de alta gama, afinación de precisión, mezcla multitrack y master comercial listo para streaming y distribución internacional.
          </p>
        </motion.div>

        {/* =========================================================================
            5. BOTONES DE ACCIÓN (CTAs CON DISPARADOR REACTIVO DE GLOW)
        ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          {/* Botón Principal: Reservar Sesión */}
          <button
            type="button"
            onClick={handleDefaultBook}
            onMouseEnter={() => setIsCtaHovered(true)}
            onMouseLeave={() => setIsCtaHovered(false)}
            className="group relative w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-syne font-bold text-sm sm:text-base uppercase tracking-wider shadow-[0_10px_30px_rgba(220,38,38,0.4)] hover:shadow-[0_15px_45px_rgba(220,38,38,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Calendar className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform duration-300" />
            <span>Reservar Sesión</span>
            <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform duration-300" />
          </button>

          {/* Botón Secundario: Ver Servicios */}
          <button
            type="button"
            onClick={handleDefaultServices}
            onMouseEnter={() => setIsCtaHovered(true)}
            onMouseLeave={() => setIsCtaHovered(false)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 font-syne font-semibold text-sm sm:text-base uppercase tracking-wider backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Headphones className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-colors" />
            <span>Ver Servicios</span>
          </button>
        </motion.div>

        {/* =========================================================================
            6. BARRA DE BENEFICIOS / TRUST STRIP
        ========================================================================= */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 sm:mt-16 pt-8 border-t border-zinc-800/60 w-full max-w-3xl flex flex-wrap items-center justify-center sm:justify-between gap-4 text-xs font-mono text-zinc-400"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-red-500" />
            <span>Monitoreo Analógico Sin Latencia</span>
          </div>
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            <span>Entrega WAV 24-bit + MP3 320k</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>Afinación en Tiempo Real</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
