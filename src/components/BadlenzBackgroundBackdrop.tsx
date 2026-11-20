import React, { useEffect, useRef, useState } from 'react';

export interface BadlenzBackgroundBackdropProps {
  /** Ruta personalizada del logo Badlenz */
  logoSrc?: string;
  /** Opacidad base de la marca de agua durante el contenido */
  opacity?: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const BadlenzBackgroundBackdrop: React.FC<BadlenzBackgroundBackdropProps> = ({
  logoSrc = '/logo-badlenz.png',
  opacity = 0.09,
}) => {
  const [imgError, setImgError] = useState(false);

  // Direct DOM refs — zero React re-renders during scroll (60/120fps compositor path)
  const logoStageRef = useRef<HTMLDivElement | null>(null);
  const outerRingRef = useRef<HTMLDivElement | null>(null);
  const innerRingRef = useRef<HTMLDivElement | null>(null);
  const crimsonGlowRef = useRef<HTMLDivElement | null>(null);
  const goldGlowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReduced = reducedMotionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
      scheduleTick();
    };
    reducedMotionQuery.addEventListener?.('change', handleMotionChange);

    let rafId: number | null = null;
    let currentScrollP = 0;
    let targetScrollP = 0;
    let currentFinaleP = 0;
    let targetFinaleP = 0;

    const measureTargets = () => {
      const docEl = document.documentElement;
      const maxScroll = Math.max(1, docEl.scrollHeight - window.innerHeight);
      targetScrollP = clamp(window.scrollY / maxScroll, 0, 1);

      const finaleEl = document.querySelector<HTMLElement>('[data-badlenz-finale="true"]');
      if (finaleEl) {
        const rect = finaleEl.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        // Starts blooming smoothly as soon as the finale stage enters the bottom of the screen
        // Reaches 1.0 when the finale occupies the main viewport cleanly
        const visibleRatio = clamp((vh - rect.top) / Math.max(260, vh * 0.72), 0, 1);
        targetFinaleP = visibleRatio;
      } else {
        targetFinaleP = 0;
      }
    };

    const applyVisuals = (scrollP: number, finaleRaw: number) => {
      const finale = easeOutCubic(clamp(finaleRaw, 0, 1));
      const invFinale = 1 - finale;
      const isMobile = window.innerWidth < 640;
      const finaleY = isMobile ? -44 : -54;

      // 1. Badlenz 3D Emblem (transform + opacity only)
      if (logoStageRef.current) {
        if (prefersReduced) {
          const finalOpacity = opacity + finale * (0.95 - opacity);
          logoStageRef.current.style.opacity = finalOpacity.toFixed(3);
          logoStageRef.current.style.transform = `translate3d(0, ${(finaleY * finale).toFixed(1)}px, 0) scale(${(
            0.96 +
            finale * 0.08
          ).toFixed(3)})`;
        } else {
          // Kinetic 3D spatial wave while scrolling, leveling heroically to 0deg at finale
          const waveY = Math.sin(scrollP * Math.PI * 3.0);
          const waveX = Math.cos(scrollP * Math.PI * 2.2);
          const waveZ = Math.sin(scrollP * Math.PI * 2.0 - 0.6);

          const rotY = waveY * (isMobile ? 16 : 24) * invFinale;
          const rotX = waveX * (isMobile ? 8 : 11) * invFinale;
          const rotZ = waveZ * (isMobile ? 6 : 8.5) * invFinale;

          // Subtle parallax vertical glide while scrolling -> locks dead-center with rings at finale
          const translateY = (scrollP - 0.5) * -44 * invFinale + finaleY * finale;

          // Dynamic scale: subtle pulse on scroll -> majestic hero reveal at finale
          const scrollScale = 0.88 + Math.sin(scrollP * Math.PI) * 0.12;
          const targetFinaleScale = isMobile ? 0.96 : 1.04;
          const scale = scrollScale * invFinale + targetFinaleScale * finale;

          // Opacity: crisp atmospheric watermark mid-page -> full vibrant color reveal at finale
          const midOpacity = opacity + Math.sin(scrollP * Math.PI) * 0.045;
          const finalOpacity = midOpacity * invFinale + 0.96 * finale;

          logoStageRef.current.style.opacity = finalOpacity.toFixed(3);
          logoStageRef.current.style.transform = `perspective(1200px) translate3d(0, ${translateY.toFixed(
            1
          )}px, 0) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(
            2
          )}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        }
      }

      // 2. Counter-rotating Studio Acoustic Rings (locked to exact same finaleY center)
      if (outerRingRef.current) {
        const deg = prefersReduced ? 0 : scrollP * 260;
        const ringScale = 0.92 + scrollP * 0.1 + finale * 0.04;
        const ringOpacity = 0.1 + scrollP * 0.08 + finale * 0.56;
        outerRingRef.current.style.opacity = ringOpacity.toFixed(3);
        outerRingRef.current.style.transform = `translate3d(0, ${(finaleY * finale).toFixed(
          1
        )}px, 0) rotate(${deg.toFixed(2)}deg) scale(${ringScale.toFixed(3)})`;
      }

      if (innerRingRef.current) {
        const deg = prefersReduced ? 0 : -scrollP * 195;
        const ringScale = 0.94 + Math.sin(scrollP * Math.PI) * 0.06 + finale * 0.04;
        const ringOpacity = 0.08 + scrollP * 0.06 + finale * 0.46;
        innerRingRef.current.style.opacity = ringOpacity.toFixed(3);
        innerRingRef.current.style.transform = `translate3d(0, ${(finaleY * finale).toFixed(
          1
        )}px, 0) rotate(${deg.toFixed(2)}deg) scale(${ringScale.toFixed(3)})`;
      }

      // 3. Opposite Parallax Atmospheric Glows (crimson & gold)
      if (crimsonGlowRef.current) {
        const dx = prefersReduced ? 0 : Math.sin(scrollP * Math.PI * 2) * 55 * invFinale;
        const dy = prefersReduced ? 0 : (scrollP - 0.5) * -70 * invFinale + finaleY * finale;
        const glowScale = 0.95 + finale * 0.28;
        const glowOpacity = 0.35 + finale * 0.6;
        crimsonGlowRef.current.style.opacity = glowOpacity.toFixed(3);
        crimsonGlowRef.current.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(
          1
        )}px, 0) scale(${glowScale.toFixed(3)})`;
      }

      if (goldGlowRef.current) {
        const dx = prefersReduced ? 0 : -Math.sin(scrollP * Math.PI * 2) * 55 * invFinale;
        const dy = prefersReduced ? 0 : (scrollP - 0.5) * 60 * invFinale + finaleY * finale;
        const glowScale = 0.9 + finale * 0.32;
        const glowOpacity = 0.28 + finale * 0.62;
        goldGlowRef.current.style.opacity = glowOpacity.toFixed(3);
        goldGlowRef.current.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(
          1
        )}px, 0) scale(${glowScale.toFixed(3)})`;
      }
    };

    const tick = () => {
      rafId = null;
      const lerpFactor = prefersReduced ? 1 : 0.14;
      currentScrollP += (targetScrollP - currentScrollP) * lerpFactor;
      currentFinaleP += (targetFinaleP - currentFinaleP) * lerpFactor;

      const settled =
        Math.abs(targetScrollP - currentScrollP) < 0.0005 &&
        Math.abs(targetFinaleP - currentFinaleP) < 0.0005;

      if (settled) {
        currentScrollP = targetScrollP;
        currentFinaleP = targetFinaleP;
      }

      applyVisuals(currentScrollP, currentFinaleP);

      if (!settled) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const scheduleTick = () => {
      measureTargets();
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    // Initial paint
    measureTargets();
    currentScrollP = targetScrollP;
    currentFinaleP = targetFinaleP;
    applyVisuals(currentScrollP, currentFinaleP);

    window.addEventListener('scroll', scheduleTick, { passive: true });
    window.addEventListener('resize', scheduleTick, { passive: true });

    // Re-check once lazy chunks settle height
    const settleTimer = window.setTimeout(scheduleTick, 500);

    return () => {
      window.removeEventListener('scroll', scheduleTick);
      window.removeEventListener('resize', scheduleTick);
      reducedMotionQuery.removeEventListener?.('change', handleMotionChange);
      window.clearTimeout(settleTimer);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [opacity]);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* Resplandor atmosférico rojo sangre con parallax reactivo al scroll */}
      <div
        ref={crimsonGlowRef}
        className="absolute w-[380px] h-[380px] sm:w-[680px] sm:h-[680px] lg:w-[860px] lg:h-[860px] rounded-full bg-red-600/20 blur-[120px] sm:blur-[150px] pointer-events-none"
        style={{ opacity: 0.35 }}
      />

      {/* Halo secundario cálido oro / ámbar con contraparallax */}
      <div
        ref={goldGlowRef}
        className="absolute w-[280px] h-[280px] sm:w-[480px] sm:h-[480px] rounded-full bg-amber-500/18 blur-[100px] sm:blur-[130px] pointer-events-none"
        style={{ opacity: 0.28 }}
      />

      {/* Anillo orbital exterior acústico (rotación vinculada al scroll + órbita suave) */}
      <div
        ref={outerRingRef}
        className="absolute w-[315px] h-[315px] sm:w-[470px] sm:h-[470px] md:w-[550px] md:h-[550px] pointer-events-none"
        style={{ opacity: 0.1 }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full animate-badlenz-orbit-slow"
          fill="none"
        >
          <circle
            cx="300"
            cy="300"
            r="286"
            stroke="url(#badlenzRingCrimson)"
            strokeWidth="1.5"
            strokeDasharray="18 14 4 14"
            strokeLinecap="round"
          />
          <circle
            cx="300"
            cy="300"
            r="268"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.75"
            strokeDasharray="2 10"
          />
          <defs>
            <linearGradient id="badlenzRingCrimson" x1="0" y1="0" x2="600" y2="600" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.25" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Anillo orbital interior (contra-rotación en scroll) */}
      <div
        ref={innerRingRef}
        className="absolute w-[250px] h-[250px] sm:w-[375px] sm:h-[375px] md:w-[440px] md:h-[440px] pointer-events-none"
        style={{ opacity: 0.08 }}
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full animate-badlenz-orbit-reverse"
          fill="none"
        >
          <circle
            cx="250"
            cy="250"
            r="236"
            stroke="url(#badlenzRingGold)"
            strokeWidth="1.25"
            strokeDasharray="60 28 8 28"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="badlenzRingGold" x1="500" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Emblema Badlenz 3D reactivo al scroll + revelación completa en la escena final */}
      {!imgError && (
        <div
          ref={logoStageRef}
          className="relative w-[280px] h-[280px] sm:w-[410px] sm:h-[410px] md:w-[480px] md:h-[480px] flex items-center justify-center will-change-transform"
          style={{ opacity }}
        >
          <div className="w-full h-full flex items-center justify-center animate-badlenz-breath">
            <img
              src={logoSrc}
              alt=""
              decoding="async"
              draggable={false}
              onError={() => setImgError(true)}
              style={{ transform: 'translate3d(-0.8%, 6.8%, 0)' }}
              className="w-full h-full object-contain filter drop-shadow-[0_12px_36px_rgba(220,38,38,0.38)]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BadlenzBackgroundBackdrop;
