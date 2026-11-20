import React from 'react';
import {
  Camera,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  ShieldAlert,
} from 'lucide-react';
import { StudioConfig } from '../../services/db';
import { BookingFormData, format12h, formatMoney } from './types';

interface BookingStep3PaymentProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  stepErrors: { nombreArtistico?: string; telefono?: string };
  setStepErrors: React.Dispatch<React.SetStateAction<{ nombreArtistico?: string; telefono?: string }>>;
  studioConfig: StudioConfig;
  subtotal: number;
  deposito: number;
  balance: number;
  isSending: boolean;
  isStartingStripe: boolean;
  copiedAthPhone: boolean;
  copiedAthAmount: boolean;
  athNumReferenciaInput: string;
  setAthNumReferenciaInput: React.Dispatch<React.SetStateAction<string>>;
  athComprobanteUrl: string;
  athComprobanteNombre: string;
  onCopyAthPhone: () => void;
  onCopyAthAmount: () => void;
  onPayWithStripe: () => void;
  onAthScreenshotUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAthScreenshot: () => void;
  onBackToStep2: () => void;
}

export const BookingStep3Payment: React.FC<BookingStep3PaymentProps> = ({
  formData,
  setFormData,
  stepErrors,
  setStepErrors,
  studioConfig,
  subtotal,
  deposito,
  balance,
  isSending,
  isStartingStripe,
  copiedAthPhone,
  copiedAthAmount,
  athNumReferenciaInput,
  setAthNumReferenciaInput,
  athComprobanteUrl,
  athComprobanteNombre,
  onCopyAthPhone,
  onCopyAthAmount,
  onPayWithStripe,
  onAthScreenshotUpload,
  onRemoveAthScreenshot,
  onBackToStep2,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-[#111827] p-4 sm:p-5 rounded-xl border border-gray-800 space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">
            PASO 3 DE 3 • CONFIRMACIÓN DE DEPÓSITO
          </span>
          <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-0.5">
            Envía tu Depósito de {formatMoney(deposito)} por ATH Móvil &amp; Recibe tu Pase VIP
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            El anticipo congela tu fecha en el studio para que nadie más tome tu turno.
          </p>
        </div>

        {/* DESGLOSE FINANCIERO CLARO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800 text-center">
            <span className="text-[10px] text-gray-400 font-mono uppercase block">Total Sesión</span>
            <strong className="text-white text-base font-mono block mt-0.5">{formatMoney(subtotal)} USD</strong>
            <span className="text-[10px] text-gray-400">
              {formData.fecha} ({format12h(formData.horaInicio)} - {format12h(formData.horaSalida)})
            </span>
          </div>

          <div className="bg-amber-950/40 p-3.5 rounded-xl border border-amber-500/60 text-center">
            <span className="text-[10px] text-amber-400 font-mono uppercase font-black block">
              DEPÓSITO REQUERIDO
            </span>
            <strong className="text-amber-400 text-xl font-mono font-black block mt-0.5">
              {formatMoney(deposito)} USD
            </strong>
            <span className="text-[10px] text-amber-300 font-bold">Vía ATH Móvil</span>
          </div>

          <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800 text-center">
            <span className="text-[10px] text-gray-400 font-mono uppercase block">Saldo al Llegar</span>
            <strong className="text-emerald-400 text-base font-mono block mt-0.5">
              {formatMoney(balance)} USD
            </strong>
            <span className="text-[10px] text-gray-400">Se liquida al llegar</span>
          </div>
        </div>

        {/* SELECTOR DE DEPÓSITO: ATH MÓVIL, TARJETA / APPLE PAY (STRIPE) O PAYPAL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, metodoPago: 'ATH Movil' }))}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              formData.metodoPago === 'ATH Movil'
                ? 'bg-[#ff6b00]/15 border-[#ff6b00] text-white shadow-lg'
                : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono uppercase font-black text-amber-400 block">
              Opción 1 · Puerto Rico
            </span>
            <strong className="text-xs sm:text-sm block mt-0.5">ATH Móvil Personal</strong>
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, metodoPago: 'Tarjeta / Stripe' }))}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              formData.metodoPago === 'Tarjeta / Stripe'
                ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-lg'
                : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono uppercase font-black text-indigo-300 block">
              Opción 2 · Instantáneo
            </span>
            <strong className="text-xs sm:text-sm block mt-0.5">Tarjeta / Apple Pay</strong>
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, metodoPago: 'PayPal' }))}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              formData.metodoPago === 'PayPal'
                ? 'bg-[#0070ba]/20 border-[#009cde] text-white shadow-lg'
                : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono uppercase font-black text-sky-300 block">
              Opción 3 · Internacional
            </span>
            <strong className="text-xs sm:text-sm block mt-0.5">PayPal (@badlenzprod)</strong>
          </button>
        </div>

        {formData.metodoPago === 'PayPal' && (
          <div className="bg-gradient-to-r from-[#003087]/35 via-black to-[#009cde]/20 border-2 border-[#009cde]/70 p-4 rounded-xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div>
                <span className="bg-[#0070ba] text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded tracking-wider">
                  PAYPAL OFICIAL
                </span>
                <span className="text-white font-black text-xs ml-2">paypal.me/badlenzprod</span>
              </div>
              <span className="text-xs text-sky-300 font-mono font-black">{formatMoney(deposito)} USD</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Envía tu depósito exacto de <strong>{formatMoney(deposito)} USD</strong> vía PayPal con el monto precargado, y luego adjunta la captura abajo o presiona{' '}
              <strong>&quot;Confirmar &amp; Emitir Pase VIP&quot;</strong>.
            </p>
            <a
              href={`${(studioConfig.paypalMeUrl || 'https://paypal.me/badlenzprod').replace(/\/+$/, '')}/${deposito}USD`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0070ba] to-[#009cde] hover:from-[#005ea6] hover:to-[#008ac5] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              <span>Enviar Depósito de {formatMoney(deposito)} por PayPal →</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <div>
              <label className="block text-gray-300 text-[11px] font-bold mb-1">
                ID de Transacción PayPal <span className="text-gray-500 font-normal">(Opcional):</span>
              </label>
              <input
                type="text"
                placeholder="Ej: 8XY12345AB678901C o correo de PayPal"
                className="w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border border-gray-700 focus:border-sky-400 focus:outline-none text-xs font-mono"
                value={athNumReferenciaInput}
                onChange={(e) => setAthNumReferenciaInput(e.target.value)}
              />
            </div>
          </div>
        )}

        {formData.metodoPago === 'Tarjeta / Stripe' && (
          <div className="bg-gradient-to-r from-indigo-950/60 via-black to-purple-950/40 border-2 border-indigo-500/60 p-4 rounded-xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div>
                <span className="bg-indigo-600 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded tracking-wider">
                  STRIPE · PAGO SEGURO
                </span>
                <span className="text-white font-black text-xs ml-2">
                  Tarjeta de Crédito / Débito / Apple Pay
                </span>
              </div>
              <span className="text-xs text-indigo-300 font-mono font-black">{formatMoney(deposito)} USD</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Paga tu depósito de <strong>{formatMoney(deposito)} USD</strong> con Visa, Mastercard, Amex o Apple Pay a través de <strong>Stripe Checkout</strong>. Al completar el pago volverás automáticamente con tu Pase VIP confirmado.
            </p>
            <button
              type="button"
              onClick={onPayWithStripe}
              disabled={isStartingStripe}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer active:scale-[0.98]"
            >
              <span>
                {isStartingStripe
                  ? 'Abriendo pasarela segura de Stripe...'
                  : `Pagar Depósito de ${formatMoney(deposito)} con Tarjeta / Apple Pay →`}
              </span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TARJETA INTERACTIVA DE ATH MÓVIL EN PUERTO RICO */}
        {formData.metodoPago === 'ATH Movil' && (
          <div className="bg-gradient-to-r from-[#ff6b00]/15 via-black to-[#009fe3]/15 border-2 border-[#ff6b00]/70 p-4 rounded-xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#ff6b00] text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded tracking-wider">
                  ATH MÓVIL OFICIAL
                </span>
                <span className="text-white font-black text-xs">
                  Transferencia Personal en Puerto Rico
                </span>
              </div>
              <span className="text-xs text-amber-400 font-mono font-black">
                Monto: {formatMoney(deposito)} USD
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-black/70 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono text-gray-400 block font-bold">
                    Número de ATH Móvil
                  </span>
                  <strong className="text-white font-mono text-base tracking-wide">(787) 240-8627</strong>
                  <span className="text-[10px] text-amber-400 block">Destinatario: Badlenz (Personal)</span>
                </div>
                <button
                  type="button"
                  onClick={onCopyAthPhone}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black transition text-xs flex items-center gap-1.5 active:scale-95 shadow-md cursor-pointer shrink-0"
                >
                  {copiedAthPhone ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span className="text-emerald-200">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-200" />
                      <span>Copiar Teléfono</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-black/70 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono text-gray-400 block font-bold">
                    Monto a Transferir
                  </span>
                  <strong className="text-amber-400 font-mono text-base">{formatMoney(deposito)} USD</strong>
                  <span className="text-[10px] text-gray-400 block">
                    Nota: &quot;{formData.nombreArtistico || 'Tu Nombre'} - {formData.fecha}&quot;
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCopyAthAmount}
                  className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 transition text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  {copiedAthAmount ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copiar Monto</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-[11px] font-bold mb-1">
                Número de Confirmación / Referencia de ATH Móvil{' '}
                <span className="text-gray-500 font-normal">(Opcional):</span>
              </label>
              <input
                type="text"
                placeholder="Ej: 098432 o pega el número de confirmación aquí"
                className="w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border border-gray-700 focus:border-amber-500 focus:outline-none text-xs font-mono"
                value={athNumReferenciaInput}
                onChange={(e) => setAthNumReferenciaInput(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* SUBIDA DE CAPTURA DE PANTALLA ATH MÓVIL */}
        <div className="bg-[#181820] border-2 border-dashed border-amber-500/60 hover:border-amber-400 p-4 sm:p-5 rounded-2xl space-y-3.5 transition shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Captura de Tarjeta / Transferencia ATH Móvil
              </span>
              <h4 className="text-xs sm:text-sm text-white font-black uppercase tracking-wide mt-0.5">
                Envía la captura de tu depósito de {formatMoney(deposito)} USD
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Adjunta la captura de tu app de ATH Móvil para activar tu Pase VIP de inmediato y apartar tu fecha.
              </p>
            </div>
            {athComprobanteUrl ? (
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-bold self-start sm:self-auto flex items-center gap-1.5 shadow">
                <Check className="w-3.5 h-3.5" /> Captura Adjunta ✓
              </span>
            ) : (
              <span className="text-[10px] bg-red-950/80 text-red-300 border border-red-800 px-3 py-1 rounded-full font-bold self-start sm:self-auto flex items-center gap-1">
                📸 Foto Recomendada
              </span>
            )}
          </div>

          {athComprobanteUrl ? (
            <div className="space-y-3 bg-black/60 p-3 rounded-xl border border-emerald-500/40">
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-black/80 max-h-52 flex items-center justify-center p-2">
                <img
                  src={athComprobanteUrl}
                  alt="Comprobante ATH Móvil"
                  className="max-h-48 rounded-lg object-contain"
                />
                <div className="absolute top-2 right-2 bg-emerald-900/90 text-emerald-200 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shadow">
                  {athComprobanteNombre || 'captura_ath_movil.png'}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs pt-1">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Comprobante cargado listo para verificación de Badlenz
                </span>
                <div className="flex items-center gap-3">
                  <label className="text-amber-400 hover:text-amber-300 text-[11px] font-bold underline cursor-pointer">
                    Cambiar captura
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onAthScreenshotUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={onRemoveAthScreenshot}
                    className="text-red-400 hover:text-red-300 text-[11px] font-bold underline cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="flex-1 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-xl transition active:scale-95 text-center">
                  <Camera className="w-4 h-4" />
                  <span>📷 Tomar Foto / 📁 Subir Captura de ATH Móvil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAthScreenshotUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Transfiere tu depósito de <strong>{formatMoney(deposito)} USD</strong> al <strong>(787) 240-8627</strong> y sube aquí la captura que confirme la transacción.
              </p>
            </div>
          )}

          {/* VÍA ALTERNATIVA WHATSAPP */}
          <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-gray-400">
            <span>¿Prefieres enviar la captura directamente desde WhatsApp?</span>
            <a
              href={`https://wa.me/17872408627?text=${encodeURIComponent(
                `¡Hola Badlenz! Estoy terminando mi reserva para ${formData.nombreArtistico || 'mi sesión'} del ${formData.fecha}. Te adjunto por aquí la captura de ATH Móvil del depósito de $${deposito} USD.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Enviar captura a Badlenz por WhatsApp 💬</span>
            </a>
          </div>
        </div>

        {/* REGLAS DE ORO */}
        <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800 text-[11px] text-gray-300 space-y-1">
          <p className="font-bold text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Reglas de Oro del Estudio (Firma Cómoda al Llegar):</span>
          </p>
          <p>
            • Cuentas con <strong>20 minutos de gracia</strong> al inicio de tu sesión en Hormigueros.
            <br />• Máximo <strong>2 acompañantes</strong> en el studio para máxima concentración creativa.
            <br />• Tu contrato de cesión y firma digital se completan directamente en tu Pase VIP al pisar el estudio.
          </p>
        </div>

        {/* IDENTIFICACIÓN DEL ARTISTA EN EL PASO 3 */}
        {!formData.nombreArtistico.trim() || !formData.telefono.trim() ? (
          <div className="bg-gradient-to-r from-amber-950/60 via-black to-red-950/40 border-2 border-amber-500/80 p-4 rounded-xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-amber-900/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide font-mono">
                  PASO FINAL
                </span>
                <span className="text-white font-bold text-xs">
                  Datos Rápidos para Emitir tu Pase VIP
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">* Requerido para la sesión</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-gray-300 font-bold block mb-1">
                  Nombre Artístico / Proyecto: <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: El King / Badlenz"
                  value={formData.nombreArtistico}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, nombreArtistico: e.target.value }));
                    setStepErrors((prev) => ({ ...prev, nombreArtistico: undefined }));
                  }}
                  className={`w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border text-xs focus:outline-none transition ${
                    stepErrors.nombreArtistico
                      ? 'border-red-500 bg-red-950/20'
                      : 'border-gray-700 focus:border-amber-500'
                  }`}
                />
                {stepErrors.nombreArtistico && (
                  <p className="text-[10px] text-red-400 mt-1 font-bold">⚠️ {stepErrors.nombreArtistico}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-bold block mb-1">
                  WhatsApp / Celular: <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1 (787) 240-8627"
                  value={formData.telefono}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, telefono: e.target.value }));
                    setStepErrors((prev) => ({ ...prev, telefono: undefined }));
                  }}
                  className={`w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border text-xs font-mono focus:outline-none transition ${
                    stepErrors.telefono
                      ? 'border-red-500 bg-red-950/20'
                      : 'border-gray-700 focus:border-amber-500'
                  }`}
                />
                {stepErrors.telefono && (
                  <p className="text-[10px] text-red-400 mt-1 font-bold">⚠️ {stepErrors.telefono}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-black/60 border border-gray-800 p-3 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-mono block">
                  Pase VIP emitido para:
                </span>
                <strong className="text-white text-xs">{formData.nombreArtistico}</strong>
                <span className="text-gray-400 text-[11px] ml-2 font-mono">({formData.telefono})</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToStep2}
              className="text-amber-400 hover:text-amber-300 text-[11px] font-bold underline cursor-pointer"
            >
              Editar datos
            </button>
          </div>
        )}

        {/* BOTÓN PRINCIPAL DE GENERAR PASE VIP */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isSending}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-gray-950 font-black text-sm sm:text-base uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSending ? (
              <>
                <span className="inline-block animate-spin border-2 border-gray-950 border-t-transparent rounded-full w-4 h-4"></span>
                <span>Confirmando Reserva...</span>
              </>
            ) : (
              <span>📋 Confirmar Reserva &amp; Generar Hoja de Sesión</span>
            )}
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-1">
            <button
              type="button"
              onClick={onBackToStep2}
              className="text-gray-400 hover:text-white transition py-1 cursor-pointer"
            >
              ← Volver a modificar mis datos
            </button>

            <a
              href={`https://wa.me/17872408627?text=${encodeURIComponent(
                `¡Dímelo Badlenz! Acabo de separar fecha para mi sesión en La Facultad Studio:\n\n• Artista: ${formData.nombreArtistico || 'Por confirmar'}\n• Fecha: ${formData.fecha}\n• Turno: ${formData.horaInicio} a ${formData.horaSalida}\n• Depósito ATH: $${deposito} USD\n\nAquí te paso la captura del recibo de ATH Móvil.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition shadow-lg active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-black text-transparent" />
              <span>Enviar Comprobante por WhatsApp al (787) 240-8627</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
