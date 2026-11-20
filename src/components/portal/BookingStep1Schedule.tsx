import React, { Suspense } from 'react';
import { Clock } from 'lucide-react';
import { SlotDisponibilidad } from '../../services/schedule';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import {
  BLOQUES_OFICIALES,
  BookingFormData,
  PackageType,
  format12h,
  formatMoney,
} from './types';

const CalendarioSection = lazyWithRetry(() =>
  import('../Calendario/CalendarioSection').then((m) => ({ default: m.CalendarioSection }))
);

interface BookingStep1ScheduleProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  selectedPackage: PackageType | null;
  subtotal: number;
  deposito: number;
  onSelectPackage: (pkg: PackageType) => void;
  onContinueToStep2: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const PACKAGE_PILLS: { id: PackageType; label: string }[] = [
  { id: 'promo', label: '🔥 Promo ($130)' },
  { id: 'pro', label: '⚡ Grabación + Mix ($200)' },
  { id: 'full', label: '★ Full Song ($350)' },
  { id: 'mezcla', label: '🎚️ Solo Mezcla ($150)' },
  { id: 'instrumental', label: '🎹 Instrumental ($200+)' },
];

export const BookingStep1Schedule: React.FC<BookingStep1ScheduleProps> = ({
  formData,
  setFormData,
  selectedPackage,
  subtotal,
  deposito,
  onSelectPackage,
  onContinueToStep2,
  onShowToast,
}) => {
  const handleSelectSlot = (slot: SlotDisponibilidad) => {
    const diaStr = String(slot.diaNumero).padStart(2, '0');
    const fechaSeleccionada =
      slot.fechaStr ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${diaStr}`;
    const primerBloque = BLOQUES_OFICIALES[0];
    setFormData((prev) => ({
      ...prev,
      fecha: fechaSeleccionada,
      horaInicio: primerBloque.start,
      horaSalida: primerBloque.end,
    }));
    onShowToast(`📅 Día ${slot.diaNumero} seleccionado con éxito`, 'success');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-[#111827] p-4 sm:p-5 rounded-xl border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
          <div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
              PASO 1 DE 3 • DISPONIBILIDAD EN VIVO
            </span>
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-0.5">
              Selecciona tu Día en el Calendario &amp; Turno de Sesión
            </h3>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full font-mono font-bold self-start sm:self-auto">
            🟢 Días en Verde = Disponibles
          </span>
        </div>

        {/* Selección compacta y ágil de paquete en Paso 1 */}
        <div className="bg-black/60 p-3.5 rounded-xl border border-gray-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                Paquete Activo:
              </span>
              <span className="text-amber-400 font-black font-mono bg-amber-950/70 border border-amber-800/60 px-2.5 py-0.5 rounded text-xs flex items-center gap-1.5 shadow-sm">
                <span>🔥</span>
                {selectedPackage === 'promo' && 'Promo Reapertura · $130 USD'}
                {selectedPackage === 'pro' && 'Grabación, Mezcla & Master · $200 USD'}
                {selectedPackage === 'full' && 'Producción Integral (Full Song) · $350 – $400 USD'}
                {selectedPackage === 'mezcla' && 'Solo Mezcla & Master · $150 USD'}
                {selectedPackage === 'instrumental' && 'Instrumental Exclusiva · $200+ USD'}
              </span>
            </div>

            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded self-start sm:self-auto">
              Depósito Hoy: {formatMoney(deposito)} USD por ATH Móvil
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-800/80">
            <span className="text-[10px] text-gray-500 font-medium mr-1 hidden sm:inline">
              Cambiar a:
            </span>
            {PACKAGE_PILLS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPackage(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedPackage === p.id
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md font-black ring-1 ring-amber-400'
                    : 'bg-[#181820] hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendario interactivo */}
        <div className="space-y-3">
          <div className="bg-black/60 p-3 rounded-2xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
            <span className="text-gray-200 font-bold text-xs">
              Toca tu día en el calendario de disponibilidad en vivo:
            </span>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/60 px-3 py-1 rounded-xl shadow">
                Día Seleccionado: {formData.fecha} ✓
              </span>
            </div>
          </div>

          <Suspense fallback={<div className="h-72 rounded-xl bg-black/40 border border-zinc-800 animate-pulse" />}>
            <CalendarioSection selectedDate={formData.fecha} onSelectSlot={handleSelectSlot} />
          </Suspense>
        </div>

        {/* Bloques oficiales de horario */}
        <div className="pt-2 border-t border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Elige uno de los 2 Bloques Diarios Oficiales:</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">4 Horas de Sesión · Máx. 5h</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BLOQUES_OFICIALES.map((bloque) => {
              const isSelected =
                formData.horaInicio === bloque.start && formData.horaSalida === bloque.end;
              return (
                <button
                  key={bloque.label}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      horaInicio: bloque.start,
                      horaSalida: bloque.end,
                    }))
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 to-red-950/40 border-amber-400 text-white font-bold ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                      : 'bg-black/40 border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block uppercase tracking-wide text-white">
                      {bloque.label}
                    </span>
                    <span className="text-xs font-mono text-amber-300 font-bold block mt-0.5">
                      {bloque.desc}
                    </span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      Incluye Premezcla al terminar la sesión
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-amber-400 bg-amber-400 text-black' : 'border-gray-700'
                    }`}
                  >
                    {isSelected && <span className="text-xs font-black">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumen en vivo de fecha y horario */}
        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-700 flex flex-wrap justify-between items-center gap-3">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-mono block">
              TURNO SELECCIONADO
            </span>
            <p className="text-emerald-400 font-black text-sm">
              📅 {formData.fecha} • ⏰ {format12h(formData.horaInicio)} a {format12h(formData.horaSalida)}
            </p>
            <span className="text-[11px] text-gray-300">
              Studio acústico tratado + monitoreo profesional listo para tu sesión.
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-mono uppercase block">
              INVERSIÓN TOTAL
            </span>
            <strong className="text-white font-mono text-base">{formatMoney(subtotal)} USD</strong>
            <span className="text-amber-400 text-xs block font-bold font-mono">
              Depósito Hoy: {formatMoney(deposito)} USD
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinueToStep2}
          className="w-full py-4 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <span>Continuar a Datos del Artista (Paso 2)</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  );
};
