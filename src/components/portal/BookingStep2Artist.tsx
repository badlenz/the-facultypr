import React from 'react';
import { CheckCircle, Smartphone, Trash2, UploadCloud, Youtube } from 'lucide-react';
import { BookingFormData } from './types';

interface BookingStep2ArtistProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  stepErrors: { nombreArtistico?: string; telefono?: string };
  setStepErrors: React.Dispatch<React.SetStateAction<{ nombreArtistico?: string; telefono?: string }>>;
  archivosSubidos: { nombre: string; tamano: string }[];
  deposito: number;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (idx: number) => void;
  onBackToStep1: () => void;
  onContinueToStep3: () => void;
}

export const BookingStep2Artist: React.FC<BookingStep2ArtistProps> = ({
  formData,
  setFormData,
  stepErrors,
  setStepErrors,
  archivosSubidos,
  deposito,
  onFileSelect,
  onRemoveFile,
  onBackToStep1,
  onContinueToStep3,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-[#111827] p-4 sm:p-6 rounded-2xl border border-gray-800 space-y-4 shadow-xl">
        <div className="border-b border-gray-800 pb-3">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
            PASO 2 DE 3 • DETALLES DE TU SESIÓN
          </span>
          <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-0.5">
            ¿Quién va a romper en el micrófono?
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Solo 4 datos clave para emitir tu Pase VIP y preparar la plantilla de Pro Tools en Hormigueros.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CAMPO 1: NOMBRE ARTÍSTICO */}
          <div>
            <label className="block text-gray-300 font-bold mb-1 text-xs">
              1. Nombre Artístico / Proyecto: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: El King / D-Flow / Tu Marca"
              className={`w-full bg-[#1e1e1e] text-white p-3 rounded-xl border text-xs focus:outline-none transition ${
                stepErrors.nombreArtistico
                  ? 'border-red-500 bg-red-950/20'
                  : 'border-gray-700 focus:border-amber-500'
              }`}
              value={formData.nombreArtistico}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  nombreArtistico: e.target.value,
                  nombreReal: formData.nombreReal || e.target.value,
                });
                setStepErrors((prev) => ({ ...prev, nombreArtistico: undefined }));
              }}
            />
            {stepErrors.nombreArtistico && (
              <p className="text-[10px] text-red-400 mt-1 font-bold">⚠️ {stepErrors.nombreArtistico}</p>
            )}
          </div>

          {/* CAMPO 2: WHATSAPP / CELULAR */}
          <div>
            <label className="block text-gray-300 font-bold mb-1 text-xs">
              2. Número de WhatsApp / Celular: <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="+1 (787) 240-8627"
              className={`w-full bg-[#1e1e1e] text-white p-3 rounded-xl border text-xs font-mono focus:outline-none transition ${
                stepErrors.telefono
                  ? 'border-red-500 bg-red-950/20'
                  : 'border-gray-700 focus:border-amber-500'
              }`}
              value={formData.telefono}
              onChange={(e) => {
                setFormData({ ...formData, telefono: e.target.value });
                setStepErrors((prev) => ({ ...prev, telefono: undefined }));
              }}
            />
            {stepErrors.telefono && (
              <p className="text-[10px] text-red-400 mt-1 font-bold">⚠️ {stepErrors.telefono}</p>
            )}
            <span className="text-[10px] text-gray-500 block mt-1">
              * Te enviamos el comprobante y pin de GPS por WhatsApp.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CAMPO 3: NOMBRE COMPLETO REAL */}
          <div>
            <label className="block text-gray-300 font-bold mb-1 text-xs">
              3. Tu Nombre Completo: <span className="text-gray-500 font-normal">(Opcional para recibo)</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Manuel E. Ramírez"
              className="w-full bg-[#1e1e1e] text-white p-3 rounded-xl border border-gray-700 focus:border-amber-500 focus:outline-none text-xs"
              value={formData.nombreReal}
              onChange={(e) => setFormData({ ...formData, nombreReal: e.target.value })}
            />
          </div>

          {/* CAMPO 4: NOTAS ADICIONALES */}
          <div>
            <label className="block text-gray-300 font-bold mb-1 text-xs">
              4. Notas adicionales o referencias: <span className="text-amber-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Estilo reggaetón comercial, voces al frente, dobles limpios..."
              className="w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border border-gray-700 focus:border-amber-500 focus:outline-none text-xs"
              value={formData.referencias}
              onChange={(e) => setFormData({ ...formData, referencias: e.target.value })}
            />
          </div>
        </div>

        {/* PRO TOOLS FAST-PASS */}
        <div className="bg-[#12141f] border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono">
                  PRO TOOLS FAST-PASS
                </span>
                <span className="text-emerald-400 font-bold text-[11px] font-mono">
                  ⚡ Ahorra 20 Minutos de tu Sesión
                </span>
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight mt-1">
                Tu Pista / Beat para el Día de la Grabación
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Badlenz preparará tu sesión de Pro Tools con el tempo (BPM) y la escala de Auto-Tune antes de que entres al studio. ¡Llegas directo a cantar!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, tipoInstrumental: 'upload' }))}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                formData.tipoInstrumental === 'upload'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                  : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Subir Beat (MP3/WAV)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, tipoInstrumental: 'youtube' }))}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                formData.tipoInstrumental === 'youtube'
                  ? 'bg-red-500/20 border-red-500 text-red-300 shadow'
                  : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <Youtube className="w-4 h-4" />
              <span>Link YouTube / Drive</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, tipoInstrumental: 'pendrive' }))}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                formData.tipoInstrumental === 'pendrive'
                  ? 'bg-gray-700/50 border-gray-400 text-white shadow'
                  : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Traigo USB / AirDrop</span>
            </button>
          </div>

          {formData.tipoInstrumental === 'upload' && (
            <div className="space-y-2 bg-black/60 p-3 rounded-xl border border-gray-800">
              <label className="block text-[11px] text-gray-300 font-bold mb-1">
                Selecciona el archivo de tu pista desde tu celular o computadora:
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={onFileSelect}
                className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-gray-950 hover:file:bg-amber-400 cursor-pointer"
              />
              {archivosSubidos.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {archivosSubidos.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs"
                    >
                      <span className="text-emerald-300 font-mono flex items-center gap-1.5 truncate">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {f.nombre} ({f.tamano})
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveFile(idx)}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.tipoInstrumental === 'youtube' && (
            <div className="space-y-2 bg-black/60 p-3 rounded-xl border border-gray-800">
              <label className="block text-[11px] text-gray-300 font-bold mb-1">
                Pega aquí el enlace de YouTube, SoundCloud, Drive o BeatStars:
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.linkYoutube}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkYoutube: e.target.value }))}
                className="w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border border-gray-700 focus:border-amber-500 text-xs font-mono"
              />
              {formData.linkYoutube && (
                <p className="text-[10px] text-emerald-400 font-mono">
                  ✓ Enlace registrado: Badlenz descargará y calibrará la pista antes de tu turno.
                </p>
              )}
            </div>
          )}

          {formData.tipoInstrumental === 'pendrive' && (
            <div className="bg-black/60 p-3 rounded-xl border border-gray-800 text-[11px] text-gray-300">
              <p>
                ✓ <strong>Entendido:</strong> Traerás tu instrumental en tu pendrive USB, disco externo o te la pasas por AirDrop con Badlenz al llegar al studio.
              </p>
            </div>
          )}
        </div>

        {/* Stems incluidos */}
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Stems multitrack y WAV 24-bit incluidos:</strong> Recibes tus pistas separadas y master comercial de alta fidelidad incluidos en tu sesión sin cargos adicionales.
          </span>
        </div>

        {/* Navegación Paso 2 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <button
            type="button"
            onClick={onBackToStep1}
            className="px-5 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition border border-gray-700 cursor-pointer"
          >
            ← Volver al Calendario
          </button>

          <button
            type="button"
            onClick={onContinueToStep3}
            className="flex-1 py-3.5 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Continuar a Depósito ATH Móvil (${deposito}) (Paso 3)</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
