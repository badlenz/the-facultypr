import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Star,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import {
  guardarCliente,
  generarCodigoSesionSeguro,
  VIP_MILESTONES,
} from '../services/db';

const SERVICIOS_FRECUENTES = [
  'Grabación de Voces',
  'Mezcla & Master',
  'Producción / Beat',
  'Tema Completo',
  'Otro',
] as const;

interface RegistroVipQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPassport?: (codigo: string) => void;
}

export const RegistroVipQrModal: React.FC<RegistroVipQrModalProps> = ({
  isOpen,
  onClose,
  onOpenPassport,
}) => {
  const [nombreArtistico, setNombreArtistico] = useState('');
  const [nombreReal, setNombreReal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [servicioFrecuente, setServicioFrecuente] = useState<string>('Grabación de Voces');
  const [error, setError] = useState<string | null>(null);
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);
  const [registeredName, setRegisteredName] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => inputRef.current?.focus(), 80);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanArt = nombreArtistico.trim();
    const cleanTel = telefono.trim();
    if (!cleanArt) {
      setError('Ingresa tu nombre artístico.');
      return;
    }
    if (!cleanTel) {
      setError('Ingresa tu número de WhatsApp / teléfono.');
      return;
    }

    setError(null);
    const cliente = guardarCliente({
      nombreArtistico: cleanArt,
      nombreReal: nombreReal.trim() || cleanArt,
      telefono: cleanTel,
      email: email.trim(),
      instagram: instagram.trim(),
      servicioFrecuente,
      codigoSesion: generarCodigoSesionSeguro(),
      estrellasVip: 0,
    });

    setRegisteredName(cliente.nombreArtistico);
    setRegisteredCode(cliente.codigoSesion || '');
  };

  const handleCopyCode = () => {
    if (!registeredCode || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(registeredCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[105] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="registro-vip-qr-title"
    >
      <div
        className="relative w-full max-w-md my-auto rounded-3xl bg-[#0b0d14] border border-amber-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

        <div className="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  La Facultad Studio · Hormigueros, PR
                </span>
                <h2
                  id="registro-vip-qr-title"
                  className="text-lg font-syne font-extrabold text-white uppercase tracking-tight"
                >
                  Registro Pasaporte VIP
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!registeredCode ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Regístrate para acumular <strong className="text-amber-300">Estrellas VIP</strong> con Badlenz en cada sesión completada (1 servicio = 1 ⭐) y desbloquear estas recompensas:
              </p>

              <div className="grid grid-cols-2 gap-1.5">
                {VIP_MILESTONES.map((m) => (
                  <div
                    key={m.pts}
                    className="rounded-xl bg-[#121521] border border-amber-500/25 px-2.5 py-2 text-left"
                  >
                    <div className="text-[11px] font-bold text-amber-300">{m.title}</div>
                    <div className="text-[10px] text-zinc-400 leading-snug mt-0.5">{m.desc}</div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                  Nombre Artístico *
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  required
                  value={nombreArtistico}
                  onChange={(e) => setNombreArtistico(e.target.value)}
                  placeholder="Ej: Zyron"
                  className="w-full bg-[#121521] border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                  WhatsApp / Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="787-000-0000"
                  className="w-full bg-[#121521] border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                    Email (para avisos)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="artista@gmail.com"
                    className="w-full bg-[#121521] border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                    Instagram (opcional)
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@tuusuario"
                    className="w-full bg-[#121521] border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                  ¿Cuál es el servicio que más trabajas conmigo?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICIOS_FRECUENTES.map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => setServicioFrecuente(srv)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                        servicioFrecuente === srv
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-[#121521] border-zinc-700/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {srv}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                  Nombre Real (opcional)
                </label>
                <input
                  type="text"
                  value={nombreReal}
                  onChange={(e) => setNombreReal(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full bg-[#121521] border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-red-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-syne font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Activar Mi Pasaporte VIP</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-syne font-extrabold text-white uppercase">
                  ¡Pasaporte VIP Activado, {registeredName}!
                </h3>
                <p className="text-xs text-zinc-300 mt-1">
                  Guarda este código para consultar tus Estrellas VIP cuando quieras:
                </p>
              </div>

              <div className="rounded-2xl bg-[#121521] border border-amber-500/40 p-4 space-y-2.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">
                  Tu Código VIP Personal
                </span>
                <div className="font-mono text-base font-bold text-white tracking-wider select-all">
                  {registeredCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar código'}</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[#121521] border border-zinc-800 p-3 text-left space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Tus Recompensas VIP (1 servicio = 1 ⭐)
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {VIP_MILESTONES.map((m) => (
                    <div key={m.pts} className="rounded-lg bg-black/40 border border-zinc-800 px-2 py-1.5">
                      <div className="text-[10px] font-bold text-white">{m.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              {onOpenPassport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPassport(registeredCode);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white font-syne font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>Ver Mi Pasaporte VIP Ahora</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RegistroVipQrModal;
