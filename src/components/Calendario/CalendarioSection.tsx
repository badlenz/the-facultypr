import React, { useState, useMemo } from 'react';
import { obtenerDisponibilidadMes, SlotDisponibilidad, formatRangeTo12h } from '../../services/schedule';

interface CalendarioSectionProps {
  selectedDate?: string;
  onSelectSlot?: (slot: SlotDisponibilidad) => void;
  sessions?: any;
  setSessions?: any;
  isAdmin?: boolean;
  key?: string;
}

export function CalendarioSection({ onSelectSlot, selectedDate, sessions, setSessions, isAdmin }: CalendarioSectionProps) {
  // Estado para la fecha del calendario en tiempo real (mes actual)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [showModal, setShowModal] = useState(false);
  const [fechaSeleccionadaModal, setFechaSeleccionadaModal] = useState<number | null>(null);
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | null>(selectedDate || null);

  React.useEffect(() => {
    if (selectedDate) {
      setInternalSelectedDate(selectedDate);
    }
  }, [selectedDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Obtener disponibilidad dinámica para el mes y año actual
  const disponibilidad = useMemo(() => {
    return obtenerDisponibilidadMes(year, month + 1);
  }, [year, month]);

  const diasSemana = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Cálculo dinámico de celdas vacías iniciales para cualquier mes/año
  const primerDiaOffset = useMemo(() => {
    return new Date(year, month, 1).getDay(); // 0 = Domingo, 1 = Lunes, etc.
  }, [year, month]);

  const celdasVacias = useMemo(() => {
    return Array.from({ length: primerDiaOffset });
  }, [primerDiaOffset]);

  const handleCellClick = (slot: SlotDisponibilidad) => {
    if (!slot.disponible && !isAdmin) return;
    
    const diaStr = String(slot.diaNumero).padStart(2, '0');
    const mesStr = String(month + 1).padStart(2, '0');
    const fullDate = `${year}-${mesStr}-${diaStr}`;
    setInternalSelectedDate(fullDate);

    if (onSelectSlot) {
      onSelectSlot({
        ...slot,
        fechaStr: fullDate
      });
    } else {
      setFechaSeleccionadaModal(slot.diaNumero);
      setShowModal(true);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMonth = parseInt(e.target.value, 10);
    setCurrentDate(new Date(year, selectedMonth, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = parseInt(e.target.value, 10);
    setCurrentDate(new Date(selectedYear, month, 1));
  };

  // --- VISTA SEMANA LOGIC ---
  const diasSemanaActual = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day); // Ir al inicio de la semana (Domingo)

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // --- VISTA DIARIA LOGIC ---
  const slotDiaActual = useMemo(() => {
    const diaNum = currentDate.getDate();
    // Si estamos en el mes del calendario
    return disponibilidad[diaNum] || {
      diaNumero: diaNum,
      disponible: false,
      motivo: 'Cerrado o sin turnos programados'
    };
  }, [currentDate, disponibilidad]);

  return (
    <div className="space-y-4">
      {/* HEADER DE CONTROL Y NAVEGACIÓN (SPATIAL COCKPIT) */}
      <div className="relative overflow-hidden rounded-3xl p-5 border border-white/10 bg-gradient-to-b from-[#10131e] via-[#0b0d14] to-[#07090f] shadow-xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-syne font-bold text-white flex items-center gap-2">
              <span className="text-red-500">📅</span> Calendario Oficial del Estudio
            </h2>
            <p className="text-xs text-zinc-400 font-dmsans">Navega y programa los 2 bloques oficiales diarios de 4 horas de sesión.</p>
          </div>

          <div className="flex items-center space-x-1 bg-black/60 p-1.5 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('mes')}
              className={`px-3.5 py-1.5 rounded-xl font-syne font-bold transition-all cursor-pointer ${
                viewMode === 'mes' ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('semana')}
              className={`px-3.5 py-1.5 rounded-xl font-syne font-bold transition-all cursor-pointer ${
                viewMode === 'semana' ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('dia')}
              className={`px-3.5 py-1.5 rounded-xl font-syne font-bold transition-all cursor-pointer ${
                viewMode === 'dia' ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Día
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN DE FECHAS */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-800/60">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Ir al mes anterior"
              className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold p-2 px-3 rounded-lg border border-gray-700 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              title="Mes Anterior"
            >
              ◀
            </button>

            {/* Selectores rápidos para mes y año */}
            <div className="flex items-center space-x-1.5">
              <select
                value={month}
                onChange={handleMonthChange}
                aria-label="Seleccionar mes del calendario"
                className="bg-[#111827] border border-gray-800 text-white text-xs font-bold rounded-lg p-2 outline-none focus:border-red-500 focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {nombresMeses.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={handleYearChange}
                aria-label="Seleccionar año del calendario"
                className="bg-[#111827] border border-gray-800 text-white text-xs font-bold rounded-lg p-2 outline-none focus:border-red-500 focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Ir al mes siguiente"
              className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold p-2 px-3 rounded-lg border border-gray-700 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              title="Siguiente Mes"
            >
              ▶
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" aria-hidden="true"></span>
              <span className="text-gray-300">Disponible (Bloques 4h)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-gray-700 rounded-full" aria-hidden="true"></span>
              <span className="text-gray-400">Bloqueado / Cerrado</span>
            </span>
          </div>
        </div>
      </div>

      {/* RENDERIZADO SEGÚN VISTA SELECTOR */}
      {viewMode === 'mes' && (
        <div className="bg-[#080a12] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-inner" role="region" aria-label="Matriz Mensual de Disponibilidad">
          {/* DÍAS DE LA SEMANA */}
          <div className="grid grid-cols-7 text-center font-bold text-[11px] text-gray-300 border-b border-gray-800 pb-2 mb-2" role="row">
            {diasSemana.map((dia, idx) => (
              <div key={idx} role="columnheader">{dia}</div>
            ))}
          </div>

          {/* CELDA MATRIZ MENSUAL */}
          <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={`Días del mes de ${nombresMeses[month]} ${year}`}>
            {celdasVacias.map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 bg-[#090d16]/30 rounded border border-gray-950 opacity-20" aria-hidden="true"></div>
            ))}

            {(Object.values(disponibilidad) as SlotDisponibilidad[]).map((slot) => {
              const diaStr = String(slot.diaNumero).padStart(2, '0');
              const mesStr = String(month + 1).padStart(2, '0');
              const fullDateStr = `${year}-${mesStr}-${diaStr}`;
              const isSelectable = slot.disponible || isAdmin;
              const isSelected = selectedDate === fullDateStr || internalSelectedDate === fullDateStr;

              return (
                <div
                  key={slot.diaNumero}
                  role="button"
                  tabIndex={isSelectable ? 0 : -1}
                  aria-disabled={!isSelectable}
                  aria-label={`Día ${slot.diaNumero} de ${nombresMeses[month]} ${year}: ${
                    slot.disponible ? `Disponible ${formatRangeTo12h(slot.horarioPermitido)}` : 'No disponible'
                  }`}
                  onClick={() => handleCellClick(slot)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && isSelectable) {
                      e.preventDefault();
                      handleCellClick(slot);
                    }
                  }}
                  className={`h-28 p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-red-600 via-amber-600 to-amber-500 border-2 border-amber-300 text-white shadow-[0_0_30px_rgba(245,158,11,0.55)] scale-[1.05] z-10 ring-4 ring-amber-400/40 animate-pulse-gentle'
                      : slot.disponible
                        ? 'bg-[#111827] border-gray-800 hover:border-red-500 cursor-pointer hover:bg-red-950/20 hover:scale-[1.02]'
                        : isAdmin
                          ? 'bg-gray-950/40 border-gray-800 hover:border-amber-500 cursor-pointer hover:bg-amber-950/10 opacity-70'
                          : 'day-booked border-red-900/40 opacity-70 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-black ${
                        isSelected 
                          ? 'text-white drop-shadow-md' 
                          : slot.disponible 
                            ? 'text-white group-hover:text-amber-400' 
                            : isAdmin 
                              ? 'text-gray-300' 
                              : 'text-gray-500 line-through decoration-red-500 decoration-2'
                      }`}>
                        {slot.diaNumero}
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping" />
                      )}
                    </div>
                    {isSelected ? (
                      <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/70 text-amber-200 border border-amber-300 shadow flex items-center gap-0.5">
                        <span>✓ ELEGIDO</span>
                      </span>
                    ) : slot.disponible ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/30" aria-hidden="true"></span>
                    ) : (
                      <span className="text-[9px] font-mono text-red-400 font-bold tracking-wider">RESERVADO</span>
                    )}
                  </div>

                  {isSelected ? (
                    <div className="text-[10px] bg-black/50 p-1.5 rounded-lg border border-amber-300/40 backdrop-blur-sm">
                      <p className="text-white font-black leading-tight flex items-center gap-1">
                        <span>★ Turno Elegido</span>
                      </p>
                      <p className="text-amber-200 text-[9px] font-mono truncate font-bold">
                        {formatRangeTo12h(slot.horarioPermitido)}
                      </p>
                    </div>
                  ) : slot.disponible ? (
                    <div className="text-[10px]">
                      <p className="text-emerald-400 font-bold leading-tight">{formatRangeTo12h(slot.horarioPermitido)}</p>
                      <p className="text-gray-300 text-[9px] truncate">{slot.motivo}</p>
                    </div>
                  ) : (
                    <div className="text-[9px] text-gray-400 leading-tight">
                      <span className="text-red-400/90 font-mono text-[9px] font-semibold block truncate">Turnos Ocupados</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* LISTA RÁPIDA DE DÍAS DISPONIBLES EN CELULARES */}
          <div className="block sm:hidden mt-4 space-y-2 border-t border-gray-800/60 pt-4">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <span>📱 Lista de Días Disponibles (Toca fácil)</span>
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {(Object.values(disponibilidad) as SlotDisponibilidad[])
                .filter(slot => slot.disponible)
                .map((slot) => {
                  const diaStr = String(slot.diaNumero).padStart(2, '0');
                  const mesStr = String(month + 1).padStart(2, '0');
                  const fullDateStr = `${year}-${mesStr}-${diaStr}`;
                  const isSelected = selectedDate === fullDateStr || internalSelectedDate === fullDateStr;

                  return (
                    <button
                      key={`touch-list-${slot.diaNumero}`}
                      type="button"
                      onClick={() => handleCellClick(slot)}
                      className={`w-full text-left p-3.5 rounded-xl border flex justify-between items-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 border-2 border-amber-300 text-white shadow-xl shadow-amber-950/60 scale-[1.02] ring-2 ring-amber-400/50'
                          : 'bg-[#111827] hover:bg-red-950/20 text-gray-300 border-gray-800 hover:border-red-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white uppercase block">
                            {slot.diaNumero} de {nombresMeses[month]}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-black/60 text-amber-200 border border-amber-300">
                              ✓ SELECCIONADO
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] ${isSelected ? 'text-amber-100 font-bold' : 'text-gray-400'} font-medium`}>
                          {slot.motivo || 'Estudio disponible'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono ${isSelected ? 'bg-black/60 text-amber-200 border-amber-300' : 'text-emerald-400 bg-emerald-950/50 border-emerald-900/30'} px-2.5 py-1 rounded-lg border block font-bold`}>
                          {formatRangeTo12h(slot.horarioPermitido)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              {(Object.values(disponibilidad) as SlotDisponibilidad[]).filter(slot => slot.disponible).length === 0 && (
                <p className="text-[11px] text-gray-500 italic text-center py-2">No hay días disponibles en este mes.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'semana' && (
        <div className="bg-[#0b0f19] p-4 rounded-xl border border-gray-800">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            Agenda de la Semana del {diasSemanaActual[0].getDate()} de {nombresMeses[diasSemanaActual[0].getMonth()]}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {diasSemanaActual.map((d, idx) => {
              const dDia = d.getDate();
              const dMes = d.getMonth();
              const dYear = d.getFullYear();
              const dDiaStr = String(dDia).padStart(2, '0');
              const dMesStr = String(dMes + 1).padStart(2, '0');
              const fullDateStr = `${dYear}-${dMesStr}-${dDiaStr}`;
              const isSelected = selectedDate === fullDateStr || internalSelectedDate === fullDateStr;

              // Obtenemos la disponibilidad para ese día específico
              const dDisponibilidad = obtenerDisponibilidadMes(dYear, dMes + 1);
              const slot = dDisponibilidad[dDia] || { diaNumero: dDia, disponible: false, motivo: 'Fuera de rango' };

              return (
                <div
                  key={idx}
                  onClick={() => (slot.disponible || isAdmin) && handleCellClick(slot)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[140px] cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-red-600 via-amber-600 to-amber-500 border-2 border-amber-300 text-white shadow-xl scale-[1.04] ring-2 ring-amber-400/50'
                      : slot.disponible
                        ? 'bg-[#111827] border-emerald-500/30 hover:border-red-600 hover:bg-red-950/15'
                        : isAdmin
                          ? 'bg-gray-950/40 border-gray-800 hover:border-amber-500 hover:bg-amber-950/10 opacity-70'
                          : 'bg-gray-950/60 border-gray-900 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="border-b border-gray-800 pb-1 mb-2 flex items-center justify-between">
                    <div>
                      <p className={`text-[10px] font-bold uppercase ${isSelected ? 'text-amber-200' : 'text-amber-500'}`}>{diasSemana[d.getDay()]}</p>
                      <p className="text-sm font-black text-white">{dDia}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[8px] font-mono font-bold bg-black/60 px-1.5 py-0.5 rounded text-amber-300 border border-amber-300">
                        ✓ ELEGIDO
                      </span>
                    )}
                  </div>

                  {slot.disponible ? (
                    <div className="text-[10px] space-y-1">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-extrabold text-[8px] uppercase tracking-wide">
                        LIBRE
                      </span>
                      <p className="text-emerald-400 font-bold leading-tight">{formatRangeTo12h(slot.horarioPermitido)}</p>
                      <p className="text-gray-400 text-[9px] truncate">{slot.motivo}</p>
                    </div>
                  ) : (
                    <div className="text-[9px] text-gray-600 italic">
                      {slot.motivo || 'Ocupado'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'dia' && (
        <div className="bg-[#0b0f19] p-5 rounded-xl border border-gray-800 max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                {diasSemana[currentDate.getDay()]}
              </p>
              <h3 className="text-base font-black text-white">
                {currentDate.getDate()} de {nombresMeses[month]}, {year}
              </h3>
            </div>

            {/* Cambiar de día */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentDate(new Date(year, month, currentDate.getDate() - 1))}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold p-1 px-2.5 rounded transition"
              >
                ◀
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month, currentDate.getDate() + 1))}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold p-1 px-2.5 rounded transition"
              >
                ▶
              </button>
            </div>
          </div>

          <div className="p-6 rounded-xl border flex flex-col items-center text-center space-y-4 bg-gray-900/40 border-gray-800">
            {slotDiaActual.disponible ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-lg animate-pulse">
                  ✅
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-1 rounded bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider">
                    Día Libre y Habilitado
                  </span>
                  <p className="text-lg font-black text-white pt-2">Horario: {formatRangeTo12h(slotDiaActual.horarioPermitido)}</p>
                  <p className="text-xs text-gray-400">{slotDiaActual.motivo}</p>
                </div>
                
                {onSelectSlot && (
                  <button
                    onClick={() => handleCellClick(slotDiaActual)}
                    className="mt-2 bg-red-700 hover:bg-red-600 text-white text-xs font-black px-6 py-2.5 rounded-lg shadow-lg uppercase tracking-wider transition"
                  >
                    {isAdmin ? 'Configurar este Día' : 'Seleccionar este Turno'}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-900/40 flex items-center justify-center text-red-400 text-lg">
                  🔒
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-1 rounded bg-gray-800 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    No Disponible / Ocupado
                  </span>
                  <p className="text-sm font-semibold text-gray-300 pt-2">El estudio está cerrado o con sesión privada agendada.</p>
                  <p className="text-xs text-gray-500 italic">Motivo: {slotDiaActual.motivo || 'Sesión Agendada'}</p>
                </div>

                {onSelectSlot && isAdmin && (
                  <button
                    onClick={() => handleCellClick(slotDiaActual)}
                    className="mt-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black px-6 py-2.5 rounded-lg shadow-lg uppercase tracking-wider transition"
                  >
                    Configurar este Día
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL EMERGENTE DE CONFIRMACIÓN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-amber-500">🏨</span> Detalle de Disponibilidad
                </h3>
                <p className="text-xs text-gray-400">Verifica la disponibilidad para reservar este bloque.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            {fechaSeleccionadaModal ? (
              <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 text-xs space-y-2">
                <p className="text-gray-300">
                  <strong>Fecha:</strong> <span className="text-amber-400 font-bold">{fechaSeleccionadaModal} de {nombresMeses[month]}, {year}</span>
                </p>
                <p className="text-gray-300">
                  <strong>Horario Habilitado:</strong> <span className="text-emerald-400 font-bold">{formatRangeTo12h(disponibilidad[fechaSeleccionadaModal]?.horarioPermitido) || 'Cargando...'}</span>
                </p>
                <p className="text-gray-300">
                  <strong>Comentarios/Motivo:</strong> <span className="text-gray-400 italic">{disponibilidad[fechaSeleccionadaModal]?.motivo || 'Estudio disponible'}</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center italic">Por favor pulsa un día habilitado.</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-1/2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
              <button
                disabled={!fechaSeleccionadaModal}
                onClick={() => {
                  if (fechaSeleccionadaModal && onSelectSlot) {
                    onSelectSlot(disponibilidad[fechaSeleccionadaModal]);
                  } else if (fechaSeleccionadaModal) {
                    alert(`El turno del ${fechaSeleccionadaModal} de ${nombresMeses[month]} de ${year} está disponible. Regístrate en el Portal Clientes para apartarlo.`);
                  }
                  setShowModal(false);
                }}
                className="w-1/2 bg-red-700 hover:bg-red-600 disabled:bg-gray-800 text-white py-2.5 rounded-lg text-xs font-bold shadow-lg uppercase tracking-wider"
              >
                Confirmar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarioSection;
