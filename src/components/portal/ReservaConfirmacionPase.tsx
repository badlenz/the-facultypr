import React from 'react';
import {
  Calendar,
  CalendarPlus,
  Camera,
  Check,
  CheckCircle,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Flame,
  Headphones,
  Image as ImageIcon,
  Info,
  Lock,
  MapPin,
  Music,
  Navigation,
  Smartphone,
  Timer,
} from 'lucide-react';
import { Reserva, StudioConfig } from '../../services/db';
import { downloadSessionIcs } from '../../utils/calendarIcs';
import { BookingFormData, PriceBreakdownItem, format12h, formatMoney } from './types';

interface ReservaConfirmacionPaseProps {
  reservaActiva: Reserva | null;
  formData: BookingFormData;
  studioConfig: StudioConfig;
  subtotal: number;
  deposito: number;
  balance: number;
  itemsDesglose: PriceBreakdownItem[];
  roughAudioPlaying: boolean;
  setRoughAudioPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  tiempoRestanteSegundos: number;
  comprobanteEnviadoExito: boolean;
  numReferenciaAth: string;
  setNumReferenciaAth: React.Dispatch<React.SetStateAction<string>>;
  comprobanteAthNombre: string;
  onUploadAthReceipt: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveAthReceipt: () => void;
  onDownloadImage: () => void;
  onDownloadPDF: () => void;
  onAddToGoogleCalendar: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ReservaConfirmacionPase: React.FC<ReservaConfirmacionPaseProps> = ({
  reservaActiva,
  formData,
  studioConfig,
  subtotal,
  deposito,
  balance,
  itemsDesglose,
  roughAudioPlaying,
  setRoughAudioPlaying,
  tiempoRestanteSegundos,
  comprobanteEnviadoExito,
  numReferenciaAth,
  setNumReferenciaAth,
  comprobanteAthNombre,
  onUploadAthReceipt,
  onSaveAthReceipt,
  onDownloadImage,
  onDownloadPDF,
  onAddToGoogleCalendar,
  onShowToast,
}) => {
  const handleDownloadIcsConfirmation = () => {
    if (!reservaActiva) return;
    downloadSessionIcs({
      id: reservaActiva.id,
      nombreArtistico: reservaActiva.nombreArtistico || formData.nombreArtistico || 'Artista',
      fecha: reservaActiva.fecha,
      fechasBloque: reservaActiva.fechasBloque,
      horaInicio: reservaActiva.horaInicio,
      horaSalida: reservaActiva.horaSalida,
      deposito: reservaActiva.deposito,
      balance: reservaActiva.balance,
      servicios: reservaActiva.servicios,
      estado: reservaActiva.estado,
      direccion: studioConfig.direccionTexto || 'La Facultad Studio, Hormigueros, Puerto Rico',
    });
    onShowToast('📅 Confirmación de calendario (.ics) descargada con recordatorios de 24h y 1h.', 'success');
  };

  return (
    <div
      id="seccion-resumen"
      className="lg:col-span-4 bg-[#1e1e1e] p-5 rounded-xl border border-red-900/40 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
            Comprobante de Reserva &amp; Recibo
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
            {reservaActiva ? `REC-${reservaActiva.id}` : 'RESERVA PENDIENTE'}
          </span>
        </div>

        {reservaActiva ? (
          <div className="space-y-4 text-xs">
            {/* TARJETA DESTACADA DE CONFIRMACIÓN DESCARGABLE .ICS AL FINALIZAR LOS 3 PASOS */}
            <div className="bg-gradient-to-r from-emerald-950/70 via-[#0f172a] to-amber-950/40 p-3.5 rounded-xl border border-emerald-500/60 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>¡Reserva Registrada!</span>
                </span>
                <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                  PASO 3 COMPLETADO
                </span>
              </div>
              <p className="text-[11px] text-zinc-200 leading-snug">
                Guarda tu cita al instante en <strong>Apple Calendar, Google Calendar u Outlook</strong> con recordatorios automáticos 24h y 1h antes de tu sesión.
              </p>
              <button
                type="button"
                onClick={handleDownloadIcsConfirmation}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-gray-950 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                title="Descargar archivo universal de calendario (.ics)"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Descargar Confirmación (.ics)</span>
              </button>
            </div>

            <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 space-y-1">
              <p className="text-gray-400">
                <strong>Artista / Titular:</strong>{' '}
                <span className="text-white font-bold">
                  {reservaActiva.nombreArtistico || formData.nombreArtistico || '-'}
                </span>
              </p>
              <p className="text-gray-400">
                <strong>Fecha Congelada:</strong>{' '}
                <span className="text-emerald-400 font-bold">{reservaActiva.fecha}</span>
              </p>
              <p className="text-gray-400">
                <strong>Horario de Sesión:</strong>{' '}
                <span className="text-amber-400 font-bold">
                  {format12h(reservaActiva.horaInicio)} - {format12h(reservaActiva.horaSalida)}
                </span>
              </p>
              <p className="text-gray-400">
                <strong>Contacto (WhatsApp):</strong>{' '}
                <span className="text-amber-400">{formData.telefono || '-'}</span>
              </p>
              {formData.redesSociales && (
                <p className="text-gray-400">
                  <strong>Redes (IG/TikTok/FB):</strong>{' '}
                  <span className="text-gray-300">{formData.redesSociales}</span>
                </p>
              )}
              <p className="text-gray-400">
                <strong>Método de Anticipo:</strong>{' '}
                <span className="text-emerald-400 font-semibold">{reservaActiva.metodoPago} (Validado)</span>
              </p>
              <p className="text-gray-400">
                <strong>Ubicación:</strong> <span className="text-zinc-300">Hormigueros, Puerto Rico</span>
              </p>
            </div>

            <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 space-y-1">
              <p className="text-gray-400 font-bold border-b border-gray-800 pb-1 mb-1">
                Detalles del Proyecto:
              </p>
              <p className="text-gray-300">
                <strong>Pista:</strong> {formData.tipoInstrumental.toUpperCase()}
              </p>
              {formData.linkYoutube && (
                <p className="text-xs text-red-400 truncate">
                  <strong>Link Beat:</strong> {formData.linkYoutube}
                </p>
              )}
              <p className="text-gray-300">
                <strong>Servicios:</strong> {reservaActiva.servicios.join(', ')}
              </p>
            </div>

            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 font-mono space-y-1.5">
              <div className="flex justify-between text-gray-400">
                <span>Monto Total:</span>
                <span className="text-white font-bold">{formatMoney(reservaActiva.subtotal)} USD</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Depósito Congelado (ATH Móvil):</span>
                <span className="font-bold">✓ {formatMoney(reservaActiva.deposito)} USD</span>
              </div>
              <div className="flex justify-between text-amber-300 font-bold pt-1.5 border-t border-gray-800">
                <span>Balance al Entregar:</span>
                <span>{formatMoney(reservaActiva.balance)} USD</span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans pt-1 leading-relaxed">
                * El balance restante se liquida contra entrega de tu Máster WAV 24-bit final y Stems.
              </p>
            </div>

            {/* BÓVEDA DE PRE-MEZCLA */}
            {(() => {
              const est = (reservaActiva.estado as string) || '';
              const isPassLiquidado =
                (reservaActiva.balance || 0) <= 0 ||
                est.toLowerCase().includes('liquid') ||
                est.toLowerCase().includes('pagad') ||
                est.toLowerCase().includes('entreg');
              return (
                <div className="bg-gradient-to-r from-red-950/40 via-black to-amber-950/30 p-3.5 rounded-lg border border-red-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-amber-500" />
                      Bóveda: Pre-mezcla WAV (Rough Mix)
                    </span>
                    {isPassLiquidado ? (
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40 font-mono font-bold flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> LIQUIDADO
                      </span>
                    ) : (
                      <span className="text-[9px] bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800/40 font-mono font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> DESCARGA BLOQUEADA HASTA LIQUIDAR
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-300">
                    {isPassLiquidado
                      ? 'Tu proyecto está liquidado. Puedes reproducir o descargar el archivo maestro en alta resolución WAV 24-bit:'
                      : 'Escucha la pre-escucha streaming del studio. La descarga del archivo final WAV se activará cuando el administrador marque tu saldo como Pagado / Liquidado.'}
                  </p>

                  <div className="bg-black/60 p-2.5 rounded-lg border border-gray-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => setRoughAudioPlaying(!roughAudioPlaying)}
                        className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shrink-0 shadow active:scale-95 transition cursor-pointer"
                        title="Reproducir preescucha en alta fidelidad"
                      >
                        {roughAudioPlaying ? (
                          <span className="text-xs font-black">❚❚</span>
                        ) : (
                          <span className="text-xs font-black ml-0.5">▶</span>
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="text-[11px] text-white font-bold truncate font-mono">
                          {reservaActiva.roughMixNombre || `${formData.nombreArtistico || 'Tema'}_RoughMix_v1.wav`}
                        </p>
                        <span className="text-[9px] text-emerald-400 font-mono block">
                          {roughAudioPlaying
                            ? '🔊 Reproduciendo en 24-bit 48kHz...'
                            : isPassLiquidado
                            ? '24-bit Studio Master • 45 MB'
                            : 'Preescucha Activa • Descarga Bloqueada'}
                        </span>
                      </div>
                    </div>

                    {isPassLiquidado ? (
                      <a
                        href="https://actions.google.com/sounds/v1/musical_tracks/hip_hop_track.ogg"
                        download={`${formData.nombreArtistico || 'Tema'}_RoughMix_v1.wav`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 transition text-[10px] font-bold flex items-center gap-1 shrink-0"
                        title="Descargar archivo WAV directo"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar WAV</span>
                      </a>
                    ) : (
                      <div
                        className="p-2 rounded-lg bg-red-950/80 text-red-400 border border-red-800/80 text-[10px] font-bold flex items-center gap-1 shrink-0"
                        title="Requiere liquidación del balance restante"
                      >
                        <Lock className="w-3 h-3 text-red-400" />
                        <span>WAV Bloqueado (${reservaActiva.balance} pend.)</span>
                      </div>
                    )}
                  </div>

                  {roughAudioPlaying && (
                    <div className="bg-black/80 p-2 rounded border border-red-950 flex items-center gap-1.5 animate-fadeIn">
                      <div className="flex-1 flex items-end gap-0.5 h-4 overflow-hidden">
                        {[12, 18, 8, 22, 14, 20, 10, 16, 24, 12, 18, 22, 8, 14, 20, 16, 24, 10, 18].map(
                          (h, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-t bg-gradient-to-t from-red-600 to-amber-400 transition-all duration-150 animate-pulse"
                              style={{
                                height: `${h}px`,
                                animationDelay: `${i * 0.05}s`,
                                animationDuration: '0.5s',
                              }}
                            />
                          )
                        )}
                      </div>
                      <span className="text-[8px] text-gray-400 font-mono">AUDIO ENGINE ACTIVO</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TEMPORIZADOR DE 30 MINUTOS & ESTADO DEL DEPÓSITO */}
            <div
              className={`p-3 rounded-lg border text-xs ${
                reservaActiva.estado === 'Confirmada' || reservaActiva.depositoEstado === 'depositado'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : tiempoRestanteSegundos <= 0
                  ? 'bg-red-950/50 border-red-800 text-red-300'
                  : 'bg-amber-950/30 border-amber-800 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Timer className="w-3.5 h-3.5 animate-pulse" />
                  {reservaActiva.estado === 'Confirmada' || reservaActiva.depositoEstado === 'depositado'
                    ? 'TURNO CONFIRMADO DEFINITIVO'
                    : 'BLOQUEO TEMPORAL DEL TURNO'}
                </span>
                {reservaActiva.estado !== 'Confirmada' && reservaActiva.depositoEstado !== 'depositado' && (
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-black/60 border border-amber-700/50 text-amber-400">
                    {Math.floor(tiempoRestanteSegundos / 60)}:
                    {String(tiempoRestanteSegundos % 60).padStart(2, '0')} min
                  </span>
                )}
              </div>

              {reservaActiva.estado === 'Confirmada' || reservaActiva.depositoEstado === 'depositado' ? (
                <p className="text-[11px] text-emerald-200">
                  ✓ Comprobante validado por Badlenz. Tu turno está 100% asegurado en el calendario.
                </p>
              ) : tiempoRestanteSegundos <= 0 ? (
                <p className="text-[11px] text-red-200">
                  ⚠️ El tiempo de retención de 30 minutos ha expirado. Si ya enviaste tu depósito vía ATH Móvil, sube tu recibo o contáctanos por WhatsApp para restaurar tu turno prioritario.
                </p>
              ) : (
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  Tienes <strong>{Math.floor(tiempoRestanteSegundos / 60)} minutos</strong> para realizar tu depósito de{' '}
                  <strong>${reservaActiva.deposito} USD</strong> vía ATH Móvil al <strong>787-240-8627</strong> y registrar el comprobante abajo.
                </p>
              )}
            </div>

            {/* SECCIÓN OPERATIVA: SUBIR COMPROBANTE DE PAGO DIRECTO */}
            <div className="bg-[#111827] p-3.5 rounded-lg border border-gray-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                  Comprobante de Pago ({reservaActiva.metodoPago === 'PayPal' ? 'PayPal @badlenzprod' : 'ATH Móvil 787-240-8627'})
                </span>
                <span className="text-[9px] text-gray-400 font-mono">
                  Depósito: ${reservaActiva.deposito}.00
                </span>
              </div>

              {reservaActiva.metodoPago === 'PayPal' && (
                <div className="bg-[#0079C1]/15 border border-[#0079C1]/40 p-2 rounded flex items-center justify-between">
                  <span className="text-[10px] text-sky-200">Enlace de pago PayPal.Me:</span>
                  <a
                    href={`https://www.paypal.com/paypalme/badlenzprod/${reservaActiva.deposito}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-[#0079C1] hover:bg-[#005ea6] text-white text-[10px] font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir paypal.me/badlenzprod</span>
                  </a>
                </div>
              )}

              {comprobanteEnviadoExito || reservaActiva.comprobanteAthUrl ? (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/80 rounded text-emerald-300 text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ¡Recibo de pago registrado exitosamente!
                  </p>
                  <p className="text-[10px] text-gray-300">
                    Badlenz verificará el comprobante en su cuenta y confirmará tu pase definitivo.
                  </p>
                  {reservaActiva.comprobanteNumReferencia && (
                    <p className="text-[10px] font-mono text-emerald-400">
                      Ref: {reservaActiva.comprobanteNumReferencia}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                      1. ID de Transacción / N° Confirmación ({reservaActiva.metodoPago}):
                    </label>
                    <input
                      type="text"
                      placeholder={
                        reservaActiva.metodoPago === 'PayPal'
                          ? 'Ej: ID de transacción PayPal o correo'
                          : 'Ej: ATH-948291 o últimos 4 dígitos'
                      }
                      value={numReferenciaAth}
                      onChange={(e) => setNumReferenciaAth(e.target.value)}
                      className="w-full bg-black/60 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                      2. Subir Captura de Pantalla del Recibo:
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer bg-black/50 hover:bg-gray-800 border border-dashed border-gray-700 hover:border-gray-500 rounded p-2 text-center transition flex items-center justify-center gap-1.5 text-[11px] text-gray-300">
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">
                          {comprobanteAthNombre || `Adjuntar captura de ${reservaActiva.metodoPago}`}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onUploadAthReceipt}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onSaveAthReceipt}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 rounded text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar y Validar Recibo de Depósito</span>
                  </button>
                </div>
              )}
            </div>

            {/* ACCIONES DEL PASE DE ENTRADA EXPRESO */}
            <div className="space-y-3.5 border-t border-gray-800 pt-3.5 mt-2">
              <div>
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <span>📲 GUARDAR EN TU TELÉFONO (EXPRESS)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onDownloadImage}
                    className="flex items-center justify-center gap-1.5 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                    title="Guardar pase como imagen JPG en tu galería"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Guardar Imagen</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDownloadPDF}
                    className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                    title="Descargar pase como archivo PDF oficial"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <span>📅 RECORDATORIO EN TU CALENDARIO</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onAddToGoogleCalendar}
                    className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                    title="Agendar en tu Google Calendar"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Google Cal</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadIcsConfirmation}
                    className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/60 text-white font-bold py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                    title="Descargar archivo universal .ics para Apple Calendar, Google Calendar y Outlook"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Apple / Outlook (.ics)</span>
                  </button>
                </div>
              </div>

              {/* GUÍA DE LLEGADA A HORMIGUEROS Y REGLAS DE LA SALA */}
              <div className="bg-gradient-to-r from-amber-950/40 via-black to-red-950/30 p-3.5 rounded-lg border border-amber-800/60 space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    Guía de Llegada • Hormigueros, PR
                  </span>
                  <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded font-mono font-bold">
                    GPS Y ACCESO
                  </span>
                </div>

                <p className="text-[10px] text-gray-300 leading-relaxed">
                  📍 <strong>{studioConfig.direccionTexto}</strong>
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={studioConfig.googleMapsLocationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black py-2 px-2 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Google Maps</span>
                  </a>
                  <a
                    href={studioConfig.wazeLocationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-2 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Abrir Waze</span>
                  </a>
                </div>

                <div className="bg-black/60 p-2 rounded border border-gray-800 space-y-1 text-[10px] text-gray-300">
                  <p className="text-amber-400 font-bold">🚗 Estacionamiento:</p>
                  <p className="text-[9px] text-gray-400">{studioConfig.instruccionesEstacionamiento}</p>
                </div>

                <div className="pt-1 border-t border-gray-800/80 space-y-1.5 text-[10px]">
                  <span className="font-bold text-red-400 uppercase tracking-wider block">
                    ⚠️ Protocolo de Sesión &amp; Entregas Badlenz:
                  </span>
                  <ul className="space-y-1 text-gray-300 list-disc list-inside text-[9.5px]">
                    <li>
                      <strong>Acompañantes:</strong> Máximo <strong>{studioConfig.maxAcompanantes} personas</strong> en sala de control para garantizar óptima acústica.
                    </li>
                    <li>
                      <strong>Pistas en WAV:</strong> Traer la instrumental en WAV 24-bit sin limitar para mejor presencia vocal.
                    </li>
                    <li>
                      <strong>Ventana de Entrega de Master:</strong> <strong>Rough Mix</strong> inmediato al finalizar las 4h; de 24 a 72 horas se entrega la <strong>Mezcla y el Máster completo</strong> vía tu Bóveda.
                    </li>
                  </ul>
                </div>
              </div>

              {/* INCENTIVO COMBO EP / ÁLBUM */}
              <div className="bg-gradient-to-r from-red-950/60 via-black to-amber-950/50 p-3.5 rounded-xl border border-red-700/60 space-y-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-500 animate-bounce" />
                    ¿Trabajando en un EP o Álbum Completo?
                  </span>
                  <span className="text-[9px] bg-red-900 text-red-200 border border-red-800/80 px-2 py-0.5 rounded font-mono font-bold">
                    OFERTA RETENCIÓN EP
                  </span>
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  Asegura tu bloque de <strong>3 o 4 temas en combo</strong> para tu próximo proyecto y congela la tarifa especial de <strong>$110 USD por canción</strong>.
                </p>
                <a
                  href={`https://wa.me/17872408627?text=${encodeURIComponent(
                    `¡Hola Badlenz! Quisiera aprovechar la oferta de Combo EP (3-4 temas @ $110/canción) para mi próximo proyecto tras mi sesión #${reservaActiva.id}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-gradient-to-r from-red-700 to-amber-500 hover:from-red-600 hover:to-amber-400 text-white font-black py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>💬 Bloquear Combo EP (3-4 Canciones) por WhatsApp</span>
                </a>
              </div>

              {/* RECORDATORIO REVISIÓN EN BÓVEDA */}
              <div className="bg-black/80 p-3 rounded-lg border border-amber-600/50 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase">
                  <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>🔔 Recordatorio Automático de Revisión de Mezcla</span>
                </div>
                <p className="text-[10px] text-gray-300 leading-normal">
                  En cuanto tu mezcla esté lista en tu Bóveda (de 24 a 72h), recibirás un aviso para escuchar la versión HD y dejar observaciones nota por nota mediante nuestro sistema de timestamps.
                </p>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-artist-portal-modal'))}
                  className="w-full py-2 px-3 rounded-lg bg-[#0b0c0e] hover:bg-amber-500/15 text-amber-300 border border-amber-500/50 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Mis Temas, Recibos &amp; Estrellas VIP ➜</span>
                </button>
              </div>

              {/* BOTÓN DIRECTO WHATSAPP */}
              <div className="pt-1">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <span>💬 ATENCIÓN DIRECTA POR WHATSAPP</span>
                </p>
                <a
                  href={`https://wa.me/17872408627?text=${encodeURIComponent(
                    `¡Hola Badlenz! Acabo de generar mi Pase VIP #${reservaActiva.id} para la sesión del ${reservaActiva.fecha} (${format12h(reservaActiva.horaInicio)}). Método de pago elegido: ${reservaActiva.metodoPago} (Depósito: $${reservaActiva.deposito} USD).`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black py-2.5 px-3 rounded-lg text-[11px] uppercase tracking-wider transition shadow-md active:scale-95 border border-emerald-400/40"
                >
                  <span>Confirmar Pase con Badlenz por WhatsApp 💬</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs animate-fadeIn">
            <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-lg text-center">
              <p className="text-[11px] font-bold text-amber-500 uppercase flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                Presupuesto en Tiempo Real
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                El precio se calcula según los servicios elegidos y las horas.
              </p>
            </div>

            {/* Detalle de Servicios */}
            <div className="bg-[#111827] p-3.5 rounded border border-gray-800 space-y-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block border-b border-gray-800 pb-1.5">
                Desglose de Conceptos
              </span>

              <div className="space-y-2">
                {itemsDesglose.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center text-xs ${
                      item.isDiscount
                        ? 'text-emerald-400 font-bold bg-emerald-950/30 px-2 py-1.5 rounded border border-emerald-800/50'
                        : 'text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">{item.name}</span>
                    <span className="font-mono font-bold">
                      {item.price < 0 ? `-$${Math.abs(item.price)} USD` : `$${item.price} USD`}
                    </span>
                  </div>
                ))}

                {itemsDesglose.length === 0 && (
                  <p className="text-center py-4 text-gray-500 italic text-[11px]">
                    Selecciona al menos un servicio para calcular tu tarifa
                  </p>
                )}
              </div>
            </div>

            {/* Resumen Financiero Temporal */}
            <div className="bg-gray-950 p-3.5 rounded border border-gray-800/80 font-mono space-y-2">
              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>Monto Total del Tema:</span>
                <span className="text-white font-bold text-xs">{formatMoney(subtotal)} USD</span>
              </div>
              <div className="flex justify-between text-emerald-400 text-[11px] bg-emerald-950/20 p-1 rounded border border-emerald-900/30">
                <span className="flex items-center gap-1 font-bold">🔒 Depósito Hoy (Apartar Turno):</span>
                <span className="font-extrabold text-xs text-emerald-400">{formatMoney(deposito)} USD</span>
              </div>
              <div className="flex justify-between text-amber-300 text-[11px] pt-1.5 border-t border-gray-800">
                <span>Balance al llegar al Studio:</span>
                <span className="text-amber-400 font-extrabold text-xs">{formatMoney(balance)} USD</span>
              </div>
            </div>

            {/* Informative Callout */}
            <div className="flex gap-2 items-start bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl text-[10px] text-emerald-300">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong>💡 Cero sorpresas:</strong> El costo total de tu tema es{' '}
                <strong>{formatMoney(subtotal)} USD</strong>. Solo abonas{' '}
                <strong>{formatMoney(deposito)} USD</strong> hoy para bloquear tu día en el calendario; los{' '}
                <strong>{formatMoney(balance)} USD</strong> restantes se pagan cuando llegues al studio.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-3 border-t border-gray-800 text-[10px] text-gray-500 text-center">
        LA FACULTAD STUDIO | BADLENZ • HORMIGUEROS, PUERTO RICO
        <br />
        ellentemalo@gmail.com • (787) 240-8627
      </div>
    </div>
  );
};
