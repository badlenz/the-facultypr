import React, { useState } from 'react';
import { StudioProject, ProjectStatusType } from '../types';
import { SecureMasterAudioPlayer } from './SecureMasterAudioPlayer';
import { 
  Download, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Sparkles, 
  Music, 
  HardDrive, 
  Smartphone, 
  Folder, 
  FileAudio, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  Activity,
  ThumbsUp,
  Share2,
  Disc,
  Mic,
  Sliders,
  Check
} from 'lucide-react';

interface BovedaVipDeliveryProps {
  project: StudioProject;
  onUpdateProject: (updated: StudioProject) => void;
  onRequestPayment: (project: StudioProject) => void;
}

export const BovedaVipDelivery: React.FC<BovedaVipDeliveryProps> = ({
  project,
  onUpdateProject,
  onRequestPayment
}) => {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [feedbackTimestamp, setFeedbackTimestamp] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isPaid = (project.balancePendiente || 0) <= 0 || 
                 project.estado === 'Pagado' || 
                 project.estado === 'Liquidado' || 
                 project.estado === 'Entregado' || 
                 project.estado === '¡Lista para Descargar! 🎉';
  const balance = isPaid ? 0 : (project.balancePendiente ?? Math.round(project.montoTotal * 0.5));

  // Pipeline State Machine
  // 1: En Grabación
  // 2: En Proceso de Mezcla
  // 3: Listo para Revisión
  // 4: Entregado
  const getPipelineIndex = (status: ProjectStatusType): number => {
    const s = (status || '').toLowerCase();
    if (s.includes('entregado') || s.includes('lista') || s.includes('completado') || project.progreso >= 100) return 3;
    if (s.includes('revisión') || s.includes('revision') || s.includes('master') || project.progreso >= 70) return 2;
    if (s.includes('mezcla') || s.includes('mezclando') || project.progreso >= 35) return 1;
    return 0; // En Grabación
  };

  const currentStep = getPipelineIndex(project.estado);

  const pipelineSteps = [
    {
      id: 'grabacion',
      title: 'En Grabación',
      emoji: '🔴',
      desc: 'Tracking de voces e instrumentos en el studio acústico con micrófono Neumann TLM 103.',
      activeColor: 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]',
      textColor: 'text-red-400',
      badgeBg: 'bg-red-950/80 text-red-300 border-red-800'
    },
    {
      id: 'mezcla',
      title: 'En Proceso de Mezcla',
      emoji: '🟡',
      desc: 'Afinación de voces con Melodyne Pro, compresión analógica y ecualización con Badlenz Sound.',
      activeColor: 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800'
    },
    {
      id: 'revision',
      title: 'Listo para Revisión',
      emoji: '🔵',
      desc: 'Pre-master MP3 activo en la Bóveda para pruebas de sonido y captura de observaciones.',
      activeColor: 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]',
      textColor: 'text-blue-400',
      badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-800'
    },
    {
      id: 'entregado',
      title: 'Entregado',
      emoji: '🟢',
      desc: 'Mezcla aprobada por el artista. Máster final WAV 24-bit y Stems multitrack listos para descarga.',
      activeColor: 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
    }
  ];

  // Aprobar Mezcla Final
  const handleAprobarMezcla = () => {
    const updated: StudioProject = {
      ...project,
      estado: 'Entregado',
      progreso: 100,
      entregables: {
        ...project.entregables,
        aprobadoPorCliente: true,
        fechaAprobacion: new Date().toISOString().split('T')[0]
      }
    };
    onUpdateProject(updated);
    setShowApproveModal(false);
    showToast('✨ ¡Mezcla Final Aprobada con Éxito! El proyecto ahora está en estado "Entregado".');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const entregables = project.entregables || {
    masterWavUrl: 'https://actions.google.com/sounds/v1/musical_tracks/hip_hop_track.ogg',
    mp3PreviewUrl: 'https://actions.google.com/sounds/v1/musical_tracks/hip_hop_track.ogg',
    instrumentalUrl: 'https://actions.google.com/sounds/v1/musical_tracks/trap_beat_instrumental.ogg',
    acapellaUrl: 'https://actions.google.com/sounds/v1/musical_tracks/vocal_hook_acapella.ogg',
    stemsUrl: 'https://drive.google.com/',
    stemsDriveProvider: 'Google Drive',
    audioSpecs: {
      bitDepth: '24-bit',
      sampleRate: '48kHz',
      lufs: '-14.0 LUFS',
      formato: 'WAV'
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-600 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* CABECERA DEL PROYECTO & IDENTIFICADOR */}
      <div className="bg-gradient-to-r from-[#18181b] via-[#1f1f23] to-[#18181b] p-5 rounded-2xl border border-gray-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-950 text-red-400 border border-red-800">
              {project.codigoProyecto || 'FAC-001'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700 uppercase">
              {project.categoria}
            </span>
            {isPaid ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                PAGO LIQUIDADO ($0 PENDIENTE)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3" />
                BALANCE PENDIENTE: ${balance}.00 USD
              </span>
            )}
          </div>
          <h2 className="text-lg md:text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
            <Disc className="w-5 h-5 text-red-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{project.nombre}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Artista: <strong className="text-white font-mono">{project.nombreArtistico || project.cliente}</strong> • Productor: <strong className="text-amber-400">{project.liderCreativo}</strong>
          </p>
        </div>

        {/* BOTÓN DE ACCIÓN RÁPIDA: APROBACIÓN O LIQUIDACIÓN */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {currentStep === 2 && !entregables.aprobadoPorCliente && (
            <button
              type="button"
              onClick={() => setShowApproveModal(true)}
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-xs px-4 py-3 rounded-xl uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-pulse"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Aprobar Mezcla Final</span>
            </button>
          )}

          {!isPaid && (
            <button
              type="button"
              onClick={() => onRequestPayment(project)}
              className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs px-4 py-3 rounded-xl uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Liquidar Saldo (${balance} USD)</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. INDICADOR DE ESTADO DEL PROYECTO (STATE MACHINE DE 4 ETAPAS) */}
      <div className="bg-[#18181b] p-5 rounded-2xl border border-gray-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              <span>ESTADO DEL PROYECTO • PIPELINE DE PRODUCCIÓN</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Seguimiento en tiempo real del flujo de trabajo en La Facultad Studio.
            </p>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border self-start sm:self-auto ${pipelineSteps[currentStep].badgeBg}`}>
            Etapa Actual: {pipelineSteps[currentStep].emoji} {pipelineSteps[currentStep].title}
          </span>
        </div>

        {/* Stepper visual 4 pasos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {pipelineSteps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-b from-gray-900 to-black border-red-600/80 shadow-lg ring-1 ring-red-500/30'
                    : isCompleted
                      ? 'bg-black/40 border-gray-800/80'
                      : 'bg-black/20 border-gray-900/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{step.emoji}</span>
                    <span className={`w-6 h-6 rounded-full text-[10px] font-mono font-black flex items-center justify-center border ${
                      isActive
                        ? step.activeColor
                        : isCompleted
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-gray-900 text-gray-500 border-gray-800'
                    }`}>
                      {isCompleted ? '✓' : idx + 1}
                    </span>
                  </div>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${
                    isActive ? step.textColor : isCompleted ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-gray-800/60 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-gray-500">Paso {idx + 1} de 4</span>
                  {isActive && (
                    <span className="text-amber-400 font-bold uppercase animate-pulse">
                      ● En Curso
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-emerald-400 font-bold uppercase">
                      ✓ Completado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Simulación para testing rápido */}
        <div className="pt-2 border-t border-gray-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <span className="text-[9px] text-gray-500 font-mono">Cambiar Estado para Pruebas en Vivo:</span>
          <div className="flex flex-wrap gap-1.5">
            {pipelineSteps.map((st, i) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  const updated: StudioProject = {
                    ...project,
                    estado: st.title as ProjectStatusType,
                    progreso: i === 0 ? 25 : i === 1 ? 50 : i === 2 ? 75 : 100
                  };
                  onUpdateProject(updated);
                  showToast(`Estado cambiado a: ${st.title}`);
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  currentStep === i
                    ? 'bg-red-700 text-white border-red-500 shadow'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
                }`}
              >
                {st.emoji} {st.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. REPRODUCTOR INTERACTIVO Y MP3 DE PRUEBA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-500" />
            <span>MP3 DE PRUEBA • REPRODUCTOR OFICIAL CON MARCA COMERCIAL</span>
          </h3>
          <span className="text-[10px] font-mono text-gray-400">
            Escucha tu tema antes de aprobar
          </span>
        </div>

        <SecureMasterAudioPlayer
          songTitle={project.nombre}
          artistName={project.nombreArtistico || project.cliente}
          audioUrl={entregables.mp3PreviewUrl}
          isFullyPaid={isPaid}
          remainingBalance={balance}
          studioDeposit={project.depositoPagado || 100}
          onTimeUpdate={setFeedbackTimestamp}
          onPayRemainingBalance={() => onRequestPayment(project)}
        />
      </div>

      {/* 3. MATRIZ ORGANIZADA DE DESCARGA DE ARCHIVOS (DELIVERY MATRIX) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-800 pb-2">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <span>MATRIZ DE ENTREGABLES • DESCARGA ORGANIZADA DE ARCHIVOS</span>
            </h3>
            <p className="text-[10px] text-gray-400">
              Archivos masterizados y stems multitrack exportados a 0dB.
            </p>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded self-start sm:self-auto">
            {isPaid ? '🔓 Acceso Completo Desbloqueado' : '🔒 Requiere Liquidación para Máster WAV y Stems'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          
          {/* ARCHIVO 1: MÁSTER WAV 24-BIT / 48kHz */}
          <div className={`p-4 rounded-xl border transition flex flex-col justify-between ${
            isPaid 
              ? 'bg-[#18181b] border-emerald-700/60 shadow-lg' 
              : 'bg-red-950/20 border-red-900/40'
          }`}>
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                  <Disc className="w-5 h-5" />
                </div>
                {isPaid ? (
                  <span className="text-[9px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded">
                    DESBLOQUEADO ✓
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-black bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> BLOQUEADO
                  </span>
                )}
              </div>

              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                1. Máster Oficial WAV (24-bit / 48kHz)
              </h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Archivo maestro sin compresión para distribución en Spotify, Apple Music, Tidal y radio.
              </p>

              <div className="mt-2.5 p-2 bg-black/50 rounded-lg border border-gray-800 text-[9px] font-mono text-gray-300 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolución:</span>
                  <span className="text-emerald-400 font-bold">24-bit / 48kHz PCM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loudness:</span>
                  <span className="text-amber-400 font-bold">-14.0 LUFS Comercial</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-800/80">
              {isPaid ? (
                <a
                  href={entregables.masterWavUrl || '#'}
                  download={`${project.nombre}_Master_24bit.wav`}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar WAV Master</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onRequestPayment(project)}
                  className="w-full bg-red-950 hover:bg-red-900 text-red-200 font-bold py-2 px-3 rounded-lg text-[11px] uppercase tracking-wider transition border border-red-800 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Liquidar ${balance} para Desbloquear</span>
                </button>
              )}
            </div>
          </div>

          {/* ARCHIVO 2: MP3 DE PRUEBA (320kbps) */}
          <div className="p-4 rounded-xl border bg-[#18181b] border-amber-800/50 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-400">
                  <FileAudio className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-mono font-black bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded">
                  LIBRE ACCESO
                </span>
              </div>

              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                2. MP3 de Prueba (320kbps)
              </h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Versión liviana y portátil para escuchar en el auto, enviar por WhatsApp o redes sociales.
              </p>

              <div className="mt-2.5 p-2 bg-black/50 rounded-lg border border-gray-800 text-[9px] font-mono text-gray-300 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bitrate:</span>
                  <span className="text-amber-400 font-bold">320 kbps CBR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uso:</span>
                  <span className="text-gray-300 font-bold">Móvil, Auto, Audición</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-800/80">
              <a
                href={entregables.mp3PreviewUrl || '#'}
                download={`${project.nombre}_Preview_320kbps.mp3`}
                className="w-full bg-amber-600 hover:bg-amber-500 text-gray-950 font-black py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Descargar MP3 Prueba</span>
              </a>
            </div>
          </div>

          {/* ARCHIVO 3: VERSIÓN INSTRUMENTAL */}
          <div className={`p-4 rounded-xl border transition flex flex-col justify-between ${
            isPaid ? 'bg-[#18181b] border-cyan-800/50 shadow-lg' : 'bg-red-950/20 border-red-900/40'
          }`}>
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                {isPaid ? (
                  <span className="text-[9px] font-mono font-black bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                    DESBLOQUEADO ✓
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-black bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> BLOQUEADO
                  </span>
                )}
              </div>

              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                3. Versión Instrumental (WAV)
              </h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Pista completa sin voces para presentaciones en vivo, conciertos y ensayos del artista.
              </p>

              <div className="mt-2.5 p-2 bg-black/50 rounded-lg border border-gray-800 text-[9px] font-mono text-gray-300 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Contenido:</span>
                  <span className="text-cyan-400 font-bold">Beat / Mix sin Voces</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Formato:</span>
                  <span className="text-gray-300 font-bold">WAV 24-bit</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-800/80">
              {isPaid ? (
                <a
                  href={entregables.instrumentalUrl || '#'}
                  download={`${project.nombre}_Instrumental_WAV.wav`}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-cyan-300 font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-gray-700 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Instrumental</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onRequestPayment(project)}
                  className="w-full bg-red-950 hover:bg-red-900 text-red-200 font-bold py-2 px-3 rounded-lg text-[11px] uppercase tracking-wider transition border border-red-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Requiere Liquidación</span>
                </button>
              )}
            </div>
          </div>

          {/* ARCHIVO 4: ACAPELLA EXPORTADA */}
          <div className={`p-4 rounded-xl border transition flex flex-col justify-between ${
            isPaid ? 'bg-[#18181b] border-purple-800/50 shadow-lg' : 'bg-red-950/20 border-red-900/40'
          }`}>
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-purple-400">
                  <Mic className="w-5 h-5" />
                </div>
                {isPaid ? (
                  <span className="text-[9px] font-mono font-black bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                    DESBLOQUEADO ✓
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-black bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> BLOQUEADO
                  </span>
                )}
              </div>

              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                4. Acapella Procesada (WAV)
              </h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Voces solas afinadas, ecualizadas y comprimidas para remixes, colaboraciones o DJs.
              </p>

              <div className="mt-2.5 p-2 bg-black/50 rounded-lg border border-gray-800 text-[9px] font-mono text-gray-300 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tuning:</span>
                  <span className="text-purple-400 font-bold">Melodyne Pro Aplicado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pistas:</span>
                  <span className="text-gray-300 font-bold">Lead + Backings</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-800/80">
              {isPaid ? (
                <a
                  href={entregables.acapellaUrl || '#'}
                  download={`${project.nombre}_Acapella_Procesada.wav`}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-gray-700 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Acapella</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onRequestPayment(project)}
                  className="w-full bg-red-950 hover:bg-red-900 text-red-200 font-bold py-2 px-3 rounded-lg text-[11px] uppercase tracking-wider transition border border-red-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Requiere Liquidación</span>
                </button>
              )}
            </div>
          </div>

          {/* ARCHIVO 5: STEMS EXPORTADOS (GOOGLE DRIVE / DROPBOX PESADOS) */}
          <div className={`p-4 rounded-xl border transition flex flex-col justify-between md:col-span-2 ${
            isPaid 
              ? 'bg-gradient-to-r from-[#18181b] via-[#1c1917] to-[#18181b] border-amber-700/60 shadow-xl' 
              : 'bg-red-950/20 border-red-900/40'
          }`}>
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-400">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-black bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded">
                    {entregables.stemsDriveProvider || 'Google Drive / Dropbox'}
                  </span>
                  {isPaid ? (
                    <span className="text-[9px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded">
                      DESBLOQUEADO ✓
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-black bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> BLOQUEADO
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>5. Stems Multitrack Completos (Drums, Bass, Synths, Vocals a 0dB)</span>
              </h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Carpeta en la nube con todas las pistas individuales exportadas desde el inicio de la línea de tiempo, listas para ingenieros de mezcla externos o presentaciones internacionales.
              </p>

              <div className="mt-2.5 p-2 bg-black/50 rounded-lg border border-gray-800 text-[9px] font-mono text-gray-300 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-gray-500 block">Alojamiento:</span>
                  <strong className="text-amber-400">{entregables.stemsDriveProvider || 'Google Drive / Dropbox'}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Tamaño Estimado:</span>
                  <strong className="text-white">{entregables.tamanoTotalMb || 650} MB</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Sincronización:</span>
                  <strong className="text-emerald-400">0.00s Timeline Sync</strong>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-800/80">
              {isPaid ? (
                <a
                  href={entregables.stemsUrl || 'https://drive.google.com/'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-black py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir Carpeta de Stems en {entregables.stemsDriveProvider || 'Google Drive'}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onRequestPayment(project)}
                  className="w-full bg-red-950 hover:bg-red-900 text-red-200 font-bold py-2.5 px-3 rounded-lg text-[11px] uppercase tracking-wider transition border border-red-800 flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Liquidar Balance (${balance} USD) para Obtener Acceso a Stems</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE APROBACIÓN DE MEZCLA */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-black flex items-center justify-center mx-auto shadow-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                ¿Aprobar Mezcla Final de "{project.nombre}"?
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Al confirmar, certificas que has escuchado el MP3 de prueba y estás 100% satisfecho con la voz, efectos, balance y masterización comercial realizada por <strong>Badlenz</strong>.
              </p>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4" />
                <span>Se marcará el estado del proyecto como "🟢 Entregado".</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4" />
                <span>Se emitirá el certificado de aprobación digital.</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Check className="w-4 h-4" />
                <span>Se desbloquearán los entregables en alta definición.</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition"
              >
                Volver a Escuchar
              </button>
              <button
                type="button"
                onClick={handleAprobarMezcla}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Sí, Aprobar Mezcla</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
