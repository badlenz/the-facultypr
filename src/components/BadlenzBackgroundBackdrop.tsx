import React, { useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export interface BadlenzBackgroundBackdropProps {
  /** Ruta personalizada del logo Badlenz (por defecto toma el archivo de public) */
  logoSrc?: string;
  /** Opacidad base en escritorio (ej: 0.07 para sutileza elegante de marca de agua) */
  opacity?: number;
  /** Permitir o deshabilitar efecto parallax con el scroll */
  enableParallax?: boolean;
}

export const BadlenzBackgroundBackdrop: React.FC<BadlenzBackgroundBackdropProps> = ({
  logoSrc = '/logo badlenz.png',
  opacity = 0.08,
  enableParallax = true,
}) => {
  const [imgError, setImgError] = useState(false);

  // Hook de Scroll de Framer Motion para vincular la posición del scroll con transformaciones 3D sutiles
  const { scrollYProgress } = useScroll();

  // Física de resorte para suavizar el desplazamiento del scroll
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 25,
    restDelta: 0.001,
  });

  // Transformaciones cinemáticas al hacer scroll:
  // 1. Parallax vertical suave (se mueve a un ritmo diferente que el contenido)
  const yParallax = useTransform(smoothProgress, [0, 1], [-30, 80]);
  
  // 2. Rotación muy lenta (-4deg a +4deg)
  const rotateParallax = useTransform(smoothProgress, [0, 1], [-2, 5]);

  // 3. Escala reactiva al scroll (da sensación de acercamiento sutil)
  const scaleParallax = useTransform(smoothProgress, [0, 0.5, 1], [0.98, 1.04, 0.96]);

  // 4. Modulación sutil de opacidad para que nunca interfiera con la lectura
  const dynamicOpacity = useTransform(
    smoothProgress,
    [0, 0.3, 0.7, 1],
    [opacity * 1.2, opacity * 0.9, opacity * 1.1, opacity * 0.85]
  );

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* =========================================================================
          1. RESPLANDOR ATMOSFÉRICO ROJO DETRÁS DEL LOGO BADLENZ
      ========================================================================= */}
      <motion.div
        className="absolute w-[450px] h-[450px] sm:w-[680px] sm:h-[680px] lg:w-[900px] lg:h-[900px] rounded-full bg-red-600/10 blur-[150px] pointer-events-none"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{
          repeat: Infinity,
          duration: 9,
          ease: 'easeInOut',
        }}
      />

      {/* Halo secundario cálido ámbar/cobre estilo tubo de preamplificador valvular */}
      <motion.div
        className="absolute w-[300px] h-[300px] sm:w-[480px] sm:h-[480px] rounded-full bg-amber-500/08 blur-[130px] pointer-events-none"
        animate={{
          scale: [1.05, 0.95, 1.05],
          opacity: [0.08, 0.16, 0.08],
        }}
        transition={{
          repeat: Infinity,
          duration: 11,
          ease: 'easeInOut',
        }}
      />

      {/* =========================================================================
          2. LOGO BADLENZ DE FONDO CON PARALLAX, RESPIRACIÓN Y SHEEN AMBIENTAL
      ========================================================================= */}
      <motion.div
        style={
          enableParallax
            ? {
                y: yParallax,
                rotate: rotateParallax,
                scale: scaleParallax,
                opacity: dynamicOpacity,
              }
            : {
                opacity,
              }
        }
        className="relative flex items-center justify-center w-[360px] sm:w-[580px] md:w-[750px] lg:w-[920px] max-w-[92vw] aspect-square"
      >
        {/* Contenedor con animación continua de respiración (idle breathing) */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            repeat: Infinity,
            duration: 7,
            ease: 'easeInOut',
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Imagen oficial Badlenz */}
          <img
            src={imgError ? '/logo-badlenz.png' : logoSrc}
            alt="Badlenz Official Studio Watermark"
            draggable={false}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedFallback1) {
                target.dataset.triedFallback1 = 'true';
                target.src = '/logo-badlenz.png';
              } else if (!target.dataset.triedFallback2) {
                target.dataset.triedFallback2 = 'true';
                target.src = '/logo%20badlenz.png';
              } else {
                setImgError(true);
              }
            }}
            className="w-full h-full object-contain filter drop-shadow-[0_0_90px_rgba(220,38,38,0.3)] saturate-[1.2]"
          />

          {/* Destello de barrido luminoso muy tenue que cruza el logo cada 8 segundos */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
              maskImage: `url("${encodeURI(logoSrc)}"), url("/logo-badlenz.png")`,
              WebkitMaskImage: `url("${encodeURI(logoSrc)}"), url("/logo-badlenz.png")`,
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
                  'linear-gradient(115deg, transparent 40%, rgba(255, 60, 60, 0.4) 50%, transparent 60%)',
                mixBlendMode: 'screen',
              }}
              animate={{
                x: ['-130%', '130%'],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                repeatDelay: 8,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Viñeta periférica oscura para garantizar máximo contraste y legibilidad */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,#07080d_95%)]" 
      />
    </div>
  );
};

export default BadlenzBackgroundBackdrop;
