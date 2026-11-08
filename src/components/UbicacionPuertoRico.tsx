import React from 'react';
import { MapPin, Navigation, Phone, MessageCircle, Clock, ShieldCheck, Car, Sparkles } from 'lucide-react';

export const UbicacionPuertoRico: React.FC = () => {
  return (
    <div id="ubicacion-estudio" className="rounded-3xl antigravity-glass-panel border border-white/10 p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.7)] scroll-mt-24">
      <div className="absolute top-0 left-1/3 w-80 h-40 bg-red-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/40 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" />
              Sede Oficial • Área Oeste de Puerto Rico
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1 font-syne">
            Ubicación del Estudio
          </h2>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Sector Hormigueros Pueblo, Carr. PR-344, Hormigueros, Puerto Rico. A 4 minutos de Mayagüez Mall.
          </p>
        </div>

        {/* Quick Contacts */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <a
            href="https://wa.me/17872408627?text=Hola%20Badlenz,%20estoy%20viendo%20la%20ubicación%20de%20La%20Facultad%20Studio%20en%20Hormigueros"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-xs uppercase tracking-wider transition shadow-md"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Directo</span>
          </a>

          <a
            href="tel:+17872408627"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider border border-gray-700 transition"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span>(787) 240-8627</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Location Card & Amenities */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Directions & Map Links */}
        <div className="lg:col-span-7 bg-[#14141a] p-4 sm:p-5 rounded-xl border border-gray-800 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">
                Ubicación del Studio
              </span>
              <h3 className="text-base font-black text-white">
                La Facultad Studio • Prod. Badlenz
              </h3>
              <p className="text-xs text-gray-300">
                Sector Hormigueros Pueblo / Carr. PR-344, Hormigueros, PR 00660
              </p>
            </div>
            <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded font-mono font-bold">
              GPS READY
            </span>
          </div>

          {/* Travel Times Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-black/50 p-2.5 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-400 block">Mayagüez Mall</span>
              <strong className="text-amber-400 text-xs sm:text-sm">~ 4 min</strong>
            </div>
            <div className="bg-black/50 p-2.5 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-400 block">Cabo Rojo</span>
              <strong className="text-amber-400 text-xs sm:text-sm">~ 8 min</strong>
            </div>
            <div className="bg-black/50 p-2.5 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-400 block">San Germán</span>
              <strong className="text-amber-400 text-xs sm:text-sm">~ 10 min</strong>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <a
              href="https://maps.google.com/?q=Hormigueros,+Puerto+Rico"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-md"
            >
              <Navigation className="w-4 h-4" />
              <span>Abrir en Google Maps</span>
            </a>

            <a
              href="https://waze.com/ul?q=Hormigueros+Puerto+Rico"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-[#33ccff]/10 hover:bg-[#33ccff]/20 text-[#33ccff] border border-[#33ccff]/40 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-md"
            >
              <Navigation className="w-4 h-4 text-[#33ccff]" />
              <span>Abrir en Waze</span>
            </a>
          </div>
        </div>

        {/* Right: Studio Amenities & Comfort */}
        <div className="lg:col-span-5 bg-[#14141a] p-4 sm:p-5 rounded-xl border border-gray-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase text-amber-500 font-bold tracking-wider block">
              Instalaciones del Studio
            </span>

            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Estacionamiento privado con portón de acceso.</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
                <span>Iluminación para grabación de tomas y video.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Studio tratado acústicamente y aire acondicionado.</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Turnos completos de 4 a 5 horas de sesión.</span>
              </div>
            </div>
          </div>

          <div className="bg-black/60 p-3 rounded-lg border border-gray-800 text-[11px] text-gray-400 font-mono">
            <span>Horarios de Grabación: Lunes a Sábado de 10:00 AM a 12:00 AM (Previa cita).</span>
          </div>
        </div>

      </div>
    </div>
  );
};
