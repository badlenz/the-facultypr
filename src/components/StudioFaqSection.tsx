import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'reservar',
    question: '¿Cómo reservo mi sesión?',
    answer:
      'Elige tu plan, selecciona tu día y bloque (tarde 1:00–5:00 PM o noche 6:00–10:00 PM) en el calendario, completa tus datos y aparta tu turno con el depósito. Tu bloque queda bloqueado en el calendario en cuanto se confirma el depósito.',
  },
  {
    id: 'deposito-pago',
    question: '¿Cuánto es el depósito y cómo lo pago?',
    answer:
      'En sesiones de grabación el depósito es de $50 USD. En producción completa y post-producción es el 50% del plan. Puedes pagar por ATH Móvil, Stripe (tarjeta/Apple Pay) o PayPal.',
  },
  {
    id: 'reembolso',
    question: '¿El depósito es reembolsable?',
    answer:
      'Sí, si cancelas o reagendas con 48 horas o más de anticipación: se devuelve completo o se aplica a tu nueva fecha. Con menos de 48 horas de aviso, o si no te presentas a tu sesión, el depósito no es reembolsable, porque tu bloque quedó reservado exclusivamente para ti.',
  },
  {
    id: 'que-incluye',
    question: '¿Qué incluye mi sesión?',
    answer:
      'Monitoreo analógico sin latencia, dirección vocal de Badlenz, afinación Melodyne, entrega en WAV 24-bit y 2 revisiones de mezcla sin cargo.',
  },
  {
    id: 'entrega',
    question: '¿Cuándo recibo mi tema terminado?',
    answer:
      'Te llevas una premezcla (rough mix) al salir del estudio. El máster final comercial WAV 24-bit se entrega en 24 a 48 horas.',
  },
  {
    id: 'revisiones',
    question: '¿Cuántas revisiones tengo? ¿Y si quiero más?',
    answer:
      'Tu plan incluye 2 revisiones gratis. Revisiones adicionales cuestan $10 USD cada una.',
  },
  {
    id: 'enviar-pista',
    question: '¿Tengo que enviar mi pista antes de la sesión?',
    answer:
      'Recomendado. Al reservar puedes subir tu beat (MP3/WAV) o pegar el enlace de YouTube/Drive con el sistema Pro Tools Fast-Pass: Badlenz pre-configura el BPM y la escala de Auto-Tune antes de que llegues. También puedes traerlo en USB o AirDrop.',
  },
  {
    id: 'tardanza',
    question: '¿Qué pasa si llego tarde?',
    answer:
      'Cuentas con 20 minutos de gracia al inicio de tu bloque. Tu sesión corre dentro del bloque reservado.',
  },
  {
    id: 'acompanantes',
    question: '¿Puedo traer acompañantes?',
    answer: 'Sí, hasta un máximo de 2 acompañantes por sesión.',
  },
  {
    id: 'ubicacion-horario',
    question: '¿Dónde están ubicados y cuál es el horario?',
    answer:
      'Sector Hormigueros Pueblo, Carr. PR-344, Hormigueros, PR, a 4 minutos de Mayagüez Mall. Estacionamiento privado con portón. Horario: lunes a sábado, 10:00 AM – 12:00 AM, por cita previa.',
  },
  {
    id: 'solo-mezcla',
    question: '¿Y si ya grabé mis voces en otro lugar?',
    answer:
      'Puedes usar el plan Solo Mezcla & Master ($150 USD): envías tus voces y tu pista, y recibes mezcla multitrack, afinación vocal y máster comercial WAV 24-bit.',
  },
];

export const StudioFaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="preguntas-frecuentes"
      aria-labelledby="faq-estudio-heading"
      className="relative overflow-hidden rounded-3xl border border-white/10 antigravity-glass-panel p-4 sm:p-6 space-y-4 shadow-[0_24px_60px_rgba(0,0,0,0.7)] scroll-mt-24"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-red-600/8 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/35 text-[9px] font-mono text-red-300 font-bold uppercase tracking-widest">
            <HelpCircle className="w-3 h-3 text-red-400" />
            <span>Dudas Comunes</span>
          </span>
          <h2
            id="faq-estudio-heading"
            className="font-syne text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight"
          >
            Preguntas Frecuentes
          </h2>
          <p className="font-dmsans text-xs text-zinc-400">
            Todo lo que necesitas saber antes de apartar tu bloque en La Facultad Studio.
          </p>
        </div>
      </div>

      <div className="relative z-10 space-y-1.5">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openId === item.id;
          const buttonId = `faq-btn-${item.id}`;
          const panelId = `faq-panel-${item.id}`;

          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-colors ${
                isOpen
                  ? 'bg-[#121521]/95 border-amber-400/40'
                  : 'bg-[#0c0f18]/85 border-white/10 hover:border-white/20'
              }`}
            >
              <h3 className="m-0">
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-3.5 sm:px-4 py-3 text-left flex items-center justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono font-bold text-amber-400/90 tabular-nums shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-syne font-bold text-xs sm:text-sm text-white leading-snug">
                      {item.question}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-amber-300' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="px-3.5 sm:px-4 pb-3 pl-9 sm:pl-10"
              >
                <p className="font-dmsans text-[11px] sm:text-xs text-zinc-300 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
