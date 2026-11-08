import React, { useState } from 'react';
import { Clock, Mic, Sparkles, Sliders, CheckCircle2, ChevronRight } from 'lucide-react';

interface StageInfo {
  time: string;
  duration: string;
  title: string;
  subtitle: string;
  description: string;
  deliverable: string;
  icon: React.ReactNode;
  badge: string;
}

export const SesionChronogram: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages: StageInfo[] = [
    {
      time: '0:00 - 0:30',
      duration: '30 min',
      title: 'Pro Tools Fast-Pass & Calentamiento',
      subtitle: 'Configuración técnica y calibración vocal',
      description: 'Badlenz importa tu beat en Pro Tools, detecta el tempo exacto (BPM) y fija la escala armónica en Auto-Tune Pro. Calibración de ganancia en el micrófono y prueba de tono.',
      deliverable: 'Sesión lista con latencia cero y auriculares seteados.',
      icon: <Sliders className="w-5 h-5 text-amber-400" />,
      badge: 'Fase 1: Setup'
    },
    {
      time: '0:30 - 2:00',
      duration: '90 min',
      title: 'Grabación de Voces Principales (Lead)',
      subtitle: 'Captura de las mejores tomas con máxima energía',
      description: 'Grabación de versos, coros e intro barra por barra o corrida. Coaching vocal en tiempo real por Badlenz para clavar el fraseo, la afinación y la intención comercial.',
      deliverable: 'Línea de voz líder completa y seleccionada (comping).',
      icon: <Mic className="w-5 h-5 text-red-400" />,
      badge: 'Fase 2: El Mic'
    },
    {
      time: '2:00 - 3:00',
      duration: '60 min',
      title: 'Dobles, Apoyos & Ad-libs',
      subtitle: 'Espacio estéreo, agresividad y dinamismo',
      description: 'Grabación de doblajes laterales (Left/Right), segundas voces, apoyos de punch en los finales de frase y ad-libs espontáneos para darle anchura a la mezcla.',
      deliverable: 'Multitrack vocal completo con capas de soporte.',
      icon: <Sparkles className="w-5 h-5 text-amber-300" />,
      badge: 'Fase 3: Capas'
    },
    {
      time: '3:00 - 4:00',
      duration: '60 min',
      title: 'Edición & Premezcla In Situ',
      subtitle: 'Te vas con tu canción sonando el mismo día',
      description: 'Limpieza de ruidos, respiraciones, afinación Melodyne en partes clave, compresión rápida y ecualización de referencia. Exportamos tu premezcla directo a tu teléfono.',
      deliverable: 'Premezcla MP3/WAV entregada al terminar la sesión.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      badge: 'Fase 4: Premezcla'
    }
  ];

  return (
    <div className="rounded-3xl border border-white/10 antigravity-glass-panel p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Glow ambient */}
      <div className="absolute top-0 right-10 w-72 h-72 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-4">
        <div>
          <h3 className="font-syne text-lg sm:text-xl font-black text-white tracking-tight mt-1">
            ¿Cómo se aprovecha tu Bloque de 4 Horas de Sesión?
          </h3>
          <p className="text-xs text-gray-400">
            En La Facultad Studio cada minuto está cronometrado para garantizar que tu canción quede grabada al máximo estándar.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-gray-800 shrink-0 self-start sm:self-auto font-mono text-xs">
          <Clock className="w-4 h-4 text-red-500" />
          <span className="text-white font-bold">Bloque Oficial: 4 a 5h</span>
        </div>
      </div>

      {/* Desktop/Tablet Stepper Bar */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2">
        {stages.map((st, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveStage(i)}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
              activeStage === i
                ? 'bg-gradient-to-b from-[#1c1d29] to-[#12131d] border-red-500 shadow-lg shadow-red-950/40 ring-1 ring-red-500/50'
                : 'bg-black/40 border-gray-800/80 hover:border-gray-700 text-gray-400'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className={`font-bold ${activeStage === i ? 'text-amber-400' : 'text-gray-500'}`}>
                {st.time}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/50 text-gray-400 border border-gray-800">
                {st.duration}
              </span>
            </div>
            <h4 className={`text-xs font-bold truncate ${activeStage === i ? 'text-white' : 'text-gray-300'}`}>
              {st.title}
            </h4>
            <div className={`mt-2 h-1 rounded-full overflow-hidden bg-gray-800`}>
              <div
                className={`h-full ${
                  activeStage === i ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-transparent'
                }`}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Detail Card of Active Stage */}
      <div className="relative z-10 bg-gradient-to-br from-[#10121c] via-[#0c0d14] to-black border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/70 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center">
              {stages[activeStage].icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase">
                  {stages[activeStage].badge}
                </span>
                <span className="text-gray-600 font-mono text-[10px]">·</span>
                <span className="text-[10px] font-mono text-amber-300 font-bold">
                  {stages[activeStage].time} ({stages[activeStage].duration})
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {stages[activeStage].title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveStage((prev) => (prev > 0 ? prev - 1 : stages.length - 1))}
              className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono transition cursor-pointer"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => setActiveStage((prev) => (prev < stages.length - 1 ? prev + 1 : 0))}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-dmsans">
          {stages[activeStage].description}
        </p>

        <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-[11px] text-gray-300">
            <strong className="text-emerald-300 uppercase font-mono text-[10px] block">Entregable de esta fase:</strong>
            {stages[activeStage].deliverable}
          </div>
        </div>
      </div>

      {/* Note after session */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400 bg-red-950/20 border border-red-900/30 rounded-xl p-3">
        <span className="font-mono text-[11px] text-amber-300">
          ⚡ <strong>Post-Sesión (Finalizada la Grabación):</strong> Badlenz realiza el Master Comercial en 24 a 48 horas con 2 revisiones gratis incluidas.
        </span>
        <span className="text-gray-400 text-[10px] shrink-0 font-mono">
          Norma 2026 Badlenz
        </span>
      </div>
    </div>
  );
};

export default SesionChronogram;
