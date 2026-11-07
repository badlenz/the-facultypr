import React, { useState, useEffect } from 'react';
import { 
  Palmtree, 
  Wrench, 
  Headphones, 
  Calendar, 
  Clock, 
  MessageCircle, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  Music2, 
  ArrowRight, 
  User, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  Volume2,
  Sliders,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { 
  StudioLiveStatus, 
  StudioLiveStatusType, 
  getStudioLiveStatus, 
  setStudioLiveStatus, 
  subscribeToStudioStatus 
} from '../services/studioStatus';
import { guardarLeadEspera, LeadEspera } from '../services/db';
import { LFCrestLogo } from './BrandingLogos';

interface AvisoEstudioCerradoProps {
  onNavigateToMuestras?: () => void;
  isAdmin?: boolean;
  isFullTakeover?: boolean;
}

export const AvisoEstudioCerrado: React.FC<AvisoEstudioCerradoProps> = ({
  onNavigateToMuestras,
  isAdmin = false,
  isFullTakeover = false
}) => {
  const [status, setStatus] = useState<StudioLiveStatus>(getStudioLiveStatus());
  
  // Form states
  const [nombreArtistico, setNombreArtistico] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tipoProyecto, setTipoProyecto] = useState<LeadEspera['tipoProyecto']>('grabacion_voces');
  const [fechaTentativa, setFechaTentativa] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  // Submission & UI feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<LeadEspera | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reason switcher for simulation / admin preview
  const [activeReason, setActiveReason] = useState<'vacaciones' | 'mantenimiento' | 'remodelacion'>(
    status.estado === 'vacaciones' ? 'vacaciones' :
    status.estado === 'remodelacion' ? 'remodelacion' : 'mantenimiento'
  );

  useEffect(() => {
    setStatus(getStudioLiveStatus());
    const unsub = subscribeToStudioStatus((newStatus) => {
      setStatus(newStatus);
      if (['vacaciones', 'mantenimiento', 'remodelacion'].includes(newStatus.estado)) {
        setActiveReason(newStatus.estado as any);
      }
    });
    return unsub;
  }, []);

  const handleReasonSwitch = (reason: 'vacaciones' | 'mantenimiento' | 'remodelacion') => {
    setActiveReason(reason);
    if (isAdmin) {
      const presetStatus = getStudioLiveStatus();
      setStudioLiveStatus({
        ...presetStatus,
        estado: reason,
        motivoCierre: reason,
        titulo: reason === 'vacaciones' ? '🌴 RECESO POR VACACIONES' :
                reason === 'mantenimiento' ? '🛠️ MANTENIMIENTO TÉCNICO' : '🎧 REMODELACIÓN ACÚSTICA',
        subtitulo: reason === 'vacaciones' ? 'Recargando creatividad para el próximo ciclo de lanzamientos.' :
                   reason === 'mantenimiento' ? 'Calibración de microfonía Neumann TLM 103 y conversores analógicos.' :
                   'Ampliación y optimización acústica para la máxima nitidez vocal.'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombreArtistico.trim()) {
      setErrorMsg('Por favor ingresa tu nombre o nombre artístico.');
      return;
    }
    if (!telefono.trim() || telefono.trim().length < 7) {
      setErrorMsg('Por favor ingresa un número de teléfono o WhatsApp válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketId = `VIP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newLead: LeadEspera = {
        id: ticketId,
        nombreArtistico: nombreArtistico.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        tipoProyecto,
        fechaTentativa: fechaTentativa || undefined,
        motivoCierre: activeReason,
        mensaje: mensaje.trim() || undefined,
        fechaRegistro: new Date().toISOString(),
        contactado: false
      };

      await guardarLeadEspera(newLead);
      setSubmittedLead(newLead);
    } catch (err) {
      setErrorMsg('Ocurrió un error al guardar tus datos. Por favor inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicket = (ticketId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticketId);
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2000);
    }
  };

  // Content configurations by reason
  const configs = {
    vacaciones: {
      badge: '🌴 RECESO DE CREATIVIDAD & DESCANSO',
      title: 'Tomando aire fresco para tu próximo hit',
      sub: 'En La Facultad Studio creemos que la música exige oídos descansados y máxima energía. Badlenz está en un breve receso para volver al 100% en cabina.',
      icon: <Palmtree className="w-6 h-6 text-amber-400" />,
      accentColor: 'from-amber-500/20 via-orange-950/20 to-transparent',
      borderColor: 'border-amber-600/40',
      reapertura: status.fechaReapertura || 'Próximo Lunes 10:00 AM',
      highlight: 'Los artistas en lista de espera tendrán prioridad de horario en la semana de reapertura.'
    },
    mantenimiento: {
      badge: '🛠️ MANTENIMIENTO TÉCNICO & CALIBRACIÓN',
      title: 'Afinando la cadena de audio profesional',
      sub: 'Estamos realizando pruebas de respuesta en frecuencia, cambio de cápsulas y calibración de los preamplificadores y conversores del Neumann TLM 103.',
      icon: <Wrench className="w-6 h-6 text-blue-400" />,
      accentColor: 'from-blue-600/20 via-cyan-950/20 to-transparent',
      borderColor: 'border-blue-500/40',
      reapertura: status.fechaReapertura || 'Jueves 10:00 AM',
      highlight: 'Tu voz merece la calibración más exacta de Puerto Rico. Cada decibel cuenta.'
    },
    remodelacion: {
      badge: '🎧 REMODELACIÓN ACÚSTICA DE CABINA',
      title: 'Evolucionando el sonido de La Facultad',
      sub: 'Estamos instalando nuevas trampas de graves de lana mineral de alta densidad y difusores QRD de madera para un tiempo de reverberación ultra seco.',
      icon: <Headphones className="w-6 h-6 text-emerald-400" />,
      accentColor: 'from-emerald-600/20 via-teal-950/20 to-transparent',
      borderColor: 'border-emerald-500/40',
      reapertura: status.fechaReapertura || '15 de Octubre',
      highlight: 'Al reabrir, estrenarás una acústica con estándar de competencia internacional.'
    }
  };

  const currentCfg = configs[activeReason];

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      {/* HEADER DE MARCA OFICIAL PARA MODO FULL TAKEOVER */}
      {isFullTakeover && (
        <div className="text-center space-y-3 pb-2 pt-2">
          <div className="flex items-center justify-center gap-3">
            <LFCrestLogo className="w-10 h-10" />
            <div className="text-left">
              <h2 className="text-base sm:text-lg font-black tracking-widest text-white uppercase font-sans">
                LA FACULTAD STUDIO
              </h2>
              <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold block uppercase">
                PRODUCIDO POR BADLENZ • HORMIGUEROS, PUERTO RICO
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SELECTOR INTERACTIVO DE ESTADO (Solo visible en modo prueba/admin, nunca para clientes en full takeover) */}
      {(!isFullTakeover || isAdmin) && (
        <div className="bg-[#18181f] p-2.5 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase text-gray-300">
              Estado de Cabina:
            </span>
            <span className="text-xs font-bold text-amber-400">
              {activeReason === 'vacaciones' ? '🌴 Vacaciones' :
               activeReason === 'mantenimiento' ? '🛠️ Mantenimiento' : '🎧 Remodelación'}
            </span>
          </div>

          {/* Botones de conmutación amigables */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-gray-800/80">
            <button
              type="button"
              onClick={() => handleReasonSwitch('vacaciones')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeReason === 'vacaciones'
                  ? 'bg-amber-500 text-gray-950 shadow-md font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🌴 Vacaciones</span>
            </button>
            <button
              type="button"
              onClick={() => handleReasonSwitch('mantenimiento')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeReason === 'mantenimiento'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🛠️ Mantenimiento</span>
            </button>
            <button
              type="button"
              onClick={() => handleReasonSwitch('remodelacion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeReason === 'remodelacion'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🎧 Remodelación</span>
            </button>
          </div>
        </div>
      )}

      {/* HERO BANNER AMIGABLE & ELEGANTE */}
      <div className={`relative overflow-hidden rounded-3xl border ${currentCfg.borderColor} bg-gradient-to-b ${currentCfg.accentColor} bg-[#121217] p-6 sm:p-10 shadow-2xl`}>
        {/* Decoración de fondo de estudio */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header con Crest y Metadata Unboxed */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-black/60 border border-gray-800 shadow-inner">
                {currentCfg.icon}
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold block">
                  {currentCfg.badge}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mt-0.5">
                  {currentCfg.title}
                </h1>
              </div>
            </div>

            {/* Metadata tipográfica limpia (sin pills) */}
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400 self-start sm:self-auto bg-black/40 px-3.5 py-2 rounded-xl border border-gray-800">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Reapertura: <strong className="text-white">{currentCfg.reapertura}</strong></span>
              <span aria-hidden="true" className="text-gray-600">·</span>
              <span>Hormigueros, PR</span>
            </div>
          </div>

          {/* Texto Explicativo Amigable */}
          <div className="max-w-2xl space-y-3">
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {currentCfg.sub}
            </p>
            <p className="text-xs text-amber-300/90 font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{currentCfg.highlight}</span>
            </p>
          </div>

          {/* TARJETAS DE CONFIANZA: MIENTRAS LA CABINA DESCANSA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-black/50 border border-gray-800/80 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-400" />
                Tiempo de Pausa
              </span>
              <div className="text-base font-bold text-white">Temporal & Controlado</div>
              <p className="text-[11px] text-gray-400">Garantiza disponibilidad a pleno rendimiento.</p>
            </div>

            <div className="bg-black/50 border border-gray-800/80 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Lista Prioritaria
              </span>
              <div className="text-base font-bold text-emerald-300">Turnos VIP 1ros</div>
              <p className="text-[11px] text-gray-400">Te escribimos antes de abrir el calendario público.</p>
            </div>

            <div className="bg-black/50 border border-gray-800/80 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Precio Promo Respetado
              </span>
              <div className="text-base font-bold text-amber-300">$130 Bloque 4h</div>
              <p className="text-[11px] text-gray-400">Tu tarifa promocional queda congelada.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE LISTA DE ESPERA / PRE-REGISTRO */}
      <div className="bg-[#18181f] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {submittedLead ? (
          /* ESTADO DE CONFIRMACIÓN EXITOSA */
          <div className="text-center py-6 px-4 space-y-6 max-w-lg mx-auto animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                ¡Pre-Registro Confirmado!
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide">
                Estás en la Lista VIP, {submittedLead.nombreArtistico}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Guardamos tus datos con éxito. En cuanto Badlenz reabra la agenda, serás de los primeros artistas en recibir mensaje para seleccionar tu bloque horario preferido.
              </p>
            </div>

            {/* Ticket de Turno VIP */}
            <div className="bg-black/70 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 font-mono text-left">
              <div>
                <span className="text-[10px] text-gray-400 uppercase block">Código de Prioridad:</span>
                <span className="text-lg font-black text-amber-400 tracking-wider">
                  {submittedLead.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyTicket(submittedLead.id)}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition"
              >
                {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTicket ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Botones de acción directa */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://wa.me/17872408627?text=${encodeURIComponent(
                  `¡Hola Badlenz! Me registré en la lista de espera de La Facultad Studio con el código ${submittedLead.id} para mi proyecto de ${submittedLead.tipoProyecto}. Mi nombre artístico es ${submittedLead.nombreArtistico}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-gray-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Escribir a Badlenz por WhatsApp</span>
              </a>

              {onNavigateToMuestras && (
                <button
                  type="button"
                  onClick={onNavigateToMuestras}
                  className="px-4 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-wider border border-gray-700 transition flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Escuchar Comparativa A/B</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSubmittedLead(null)}
              className="text-[11px] text-gray-500 hover:text-gray-300 underline font-mono pt-2"
            >
              Registrar otro artista o proyecto
            </button>
          </div>
        ) : (
          /* FORMULARIO DE ENTRADA */
          <div className="space-y-6">
            <div className="border-b border-gray-800/80 pb-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Send className="w-4 h-4" />
                <span>Lista Prioritaria de Reapertura • Badlenz</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider mt-1">
                Asegura tu turno antes de abrir la agenda pública
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Déjanos tu contacto y el tipo de tema que estás preparando. Te avisaremos 24 horas antes de publicar las fechas en Instagram.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl font-mono">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Artístico */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    Nombre o Nombre Artístico <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Yovng Flex / Manuel R."
                    value={nombreArtistico}
                    onChange={(e) => setNombreArtistico(e.target.value)}
                    className="w-full bg-[#111116] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition"
                  />
                </div>

                {/* Teléfono / WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Teléfono / WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. (787) 240-8627"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-[#111116] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de Proyecto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5 text-amber-400" />
                    Tipo de Trabajo Necesario
                  </label>
                  <select
                    value={tipoProyecto}
                    onChange={(e) => setTipoProyecto(e.target.value as any)}
                    className="w-full bg-[#111116] border border-gray-700 rounded-xl p-3 text-xs text-white focus:border-red-500 focus:outline-none transition cursor-pointer"
                  >
                    <option value="grabacion_voces">🎤 Grabación de Voces (Bloque 4h)</option>
                    <option value="mezcla_master">🎛️ Mezcla & Master Comercial</option>
                    <option value="album_ep">💿 Proyecto Completo (EP / Álbum)</option>
                    <option value="instrumental">🎹 Beatmaking & Grabación</option>
                    <option value="otro">✨ Consulta Especial / Asesoría</option>
                  </select>
                </div>

                {/* Fecha / Semana Tentativa */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    Fecha o Semana Deseada (Tentativa)
                  </label>
                  <input
                    type="date"
                    value={fechaTentativa}
                    onChange={(e) => setFechaTentativa(e.target.value)}
                    className="w-full bg-[#111116] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Mensaje opcional o comentarios */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                  Detalles de tu tema (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Tengo el beat listo en YouTube y quiero grabar voces para sacarlo el próximo mes..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="w-full bg-[#111116] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition resize-none"
                />
              </div>

              {/* Botón de Enviar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-950/60 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Guardando en Lista VIP...' : 'Anotarme en la Lista Prioritaria de Badlenz →'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ACCESO RÁPIDO A PRUEBA DE AUDIO MIENTRAS ESPERAN */}
      <div className="bg-[#121217] border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              ¿Quieres escuchar cómo sonará tu voz aquí?
            </h4>
            <p className="text-[11px] text-gray-400">
              Escucha la demostración A/B con el micrófono Neumann TLM 103 antes y después de mezclar.
            </p>
          </div>
        </div>

        {onNavigateToMuestras && (
          <button
            type="button"
            onClick={onNavigateToMuestras}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-400 hover:text-white font-bold text-xs uppercase tracking-wider transition border border-gray-700 shrink-0"
          >
            Escuchar Muestras A/B →
          </button>
        )}
      </div>
    </section>
  );
};

export default AvisoEstudioCerrado;
