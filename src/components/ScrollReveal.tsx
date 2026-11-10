import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  className = '', 
  delayMs = 0 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fallback if IntersectionObserver is not supported
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    // Si el elemento ya está dentro o cerca del viewport al montar, hacerlo visible de inmediato
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.top < window.innerHeight + 150) {
        setIsVisible(true);
        return;
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Una vez revelado, permanece visible permanentemente
        }
      },
      { 
        threshold: 0.01, 
        rootMargin: '120px 0px 120px 0px' 
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    // Respaldo de seguridad: garantizar que ningún contenido quede oculto si el observer se retrasa
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`reveal-module ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
