import React, { useState, useMemo } from 'react';
import { StudioProject, ProjectStatusType, ProjectMilestone, generateNextProjectCode } from '../../types';
import { ContractModal } from './ContractModal';
import { syncProjectToGoogleSheets, syncAllToGoogleSheets } from '../../services/googleSheets';
import { 
  Kanban, 
  Search, 
  Plus, 
  CheckSquare, 
  Square, 
  Clock, 
  User, 
  Folder, 
  Sparkles, 
  MoreVertical, 
  Trash2,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Lock
} from 'lucide-react';

interface ProyectosSectionProps {
  projects: StudioProject[];
  setProjects: React.Dispatch<React.SetStateAction<StudioProject[]>>;
  onAskGeminiForProject: (project: StudioProject) => void;
}

export const ProyectosSection: React.FC<ProyectosSectionProps> = ({
  projects,
  setProjects,
  onAskGeminiForProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedContractProject, setSelectedContractProject] = useState<StudioProject | null>(null);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newCategory, setNewCategory] = useState('Grabación de Voces / Tracking');
  const [newMonto, setNewMonto] = useState('1500');
  const [newLead, setNewLead] = useState('Valeria Gómez');
  const [newDeadline, setNewDeadline] = useState('2026-09-01');

  const projectCategories = [
    'Grabación de Voces / Tracking',
    'Producción de Beat / Instrumental',
    'Mezcla & Masterización',
    'Producción Integral / Completa',
    'Edición & Afinación Vocal'
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigoProyecto && p.codigoProyecto.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || p.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [projects, searchTerm, selectedCategory]);

  // Toggle milestone completion & re-calculate progress
  const handleToggleMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const updatedHitos = p.hitos.map(h =>
            h.id === milestoneId ? { ...h, completado: !h.completado } : h
          );
          const completedCount = updatedHitos.filter(h => h.completado).length;
          const newProgreso = updatedHitos.length > 0 
            ? Math.round((completedCount / updatedHitos.length) * 100)
            : p.progreso;

          let newStatus = p.estado;
          if (newProgreso === 100) newStatus = 'Entregado';
          else if (newProgreso > 0 && p.estado === 'En Cotización') newStatus = 'En Producción';

          return {
            ...p,
            hitos: updatedHitos,
            progreso: newProgreso,
            estado: newStatus,
          };
        }
        return p;
      })
    );
  };

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleChangeStatus = async (projectId: string, newStatus: ProjectStatusType) => {
    let targetProj: StudioProject | undefined;
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          targetProj = { ...p, estado: newStatus };
          return targetProj;
        }
        return p;
      })
    );

    if (targetProj) {
      try {
        const res = await syncProjectToGoogleSheets(targetProj);
        showToast(res.message || 'Proyecto actualizado y sincronizado en Google Sheets');
      } catch (e) {
        showToast('Estado de proyecto actualizado');
      }
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newClientName.trim()) return;

    const newProjItem: StudioProject = {
      id: `proj-${Date.now()}`,
      codigoProyecto: generateNextProjectCode(projects),
      nombre: newProjectName.trim(),
      cliente: newClientName.trim(),
      email: '',
      categoria: newCategory,
      montoTotal: parseFloat(newMonto) || 1200,
      progreso: 10,
      estado: 'En Diseño',
      fechaEntrega: newDeadline,
      liderCreativo: newLead,
      moneda: '$ USD',
      hitos: [
        { id: 'h1', titulo: 'Aprobación de Briefing & Anticipo', completado: true },
        { id: 'h2', titulo: 'Desarrollo de propuesta de diseño', completado: false },
        { id: 'h3', titulo: 'Revisión y ajustes del cliente', completado: false },
        { id: 'h4', titulo: 'Entrega final y finiquito', completado: false },
      ],
    };

    setProjects(prev => [newProjItem, ...prev]);
    setShowNewProjectModal(false);
    setNewProjectName('');
    setNewClientName('');
  };

  const getStatusBadgeClass = (status: ProjectStatusType) => {
    switch (status) {
      case 'Liquidado':
      case 'Pagado':
      case 'Entregado':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      case 'En Producción':
      case 'En Grabación':
        return 'bg-red-950/80 text-red-400 border-red-800';
      case 'En Mezcla':
      case 'En Proceso de Mezcla':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'En Diseño':
        return 'bg-zinc-800 text-zinc-200 border-zinc-700';
      case 'En Revisión':
      case 'Listo para Revisión':
        return 'bg-blue-950/80 text-blue-400 border-blue-800';
      case 'Pausado':
        return 'bg-neutral-900 text-neutral-400 border-neutral-800';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30 animate-bounce">
          <FileText className="w-5 h-5 text-amber-300" />
          <span className="font-semibold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Banner Spatial Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#10131e] via-[#0b0d14] to-[#07090f] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-gradient-to-r from-red-600 to-amber-600 text-white uppercase tracking-widest shadow">
                GESTIÓN DE PRODUCCIÓN
              </span>
              <span className="text-xs text-zinc-400 font-mono">Control Room · Hitos &amp; Stems</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-syne font-bold text-white tracking-tight">
              Estado de Proyectos Musicales
            </h1>
            <p className="text-zinc-300 text-xs font-dmsans max-w-2xl">
              Monitorea el progreso de mezcla, grabación, entrega de stems y balances pendientes por artista.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={async () => {
                const res = await syncAllToGoogleSheets([], projects);
                if (res.spreadsheetUrl) {
                  window.open(res.spreadsheetUrl, '_blank');
                }
                showToast(res.message || 'Sincronizado con Google Sheets');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              title="Sincronizar todos los proyectos con Google Sheets en Drive"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="font-syne">Exportar a Sheets</span>
            </button>

            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-syne font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-950/50 active:scale-95 cursor-pointer"
              id="btn-new-project"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por proyecto o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0e17] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-red-500 shadow-inner"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold shadow-md shadow-red-950/40'
                : 'bg-[#0c0e17] text-zinc-400 hover:text-white border border-white/10 hover:bg-white/5'
            }`}
          >
            Todos ({projects.length})
          </button>
          {projectCategories.map(cat => {
            const count = projects.filter(p => p.categoria === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold shadow-md shadow-red-950/40'
                    : 'bg-[#0c0e17] text-zinc-400 hover:text-white border border-white/10 hover:bg-white/5'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-white/10 bg-gradient-to-b from-[#111422] to-[#0a0c14] hover:border-red-500/40 hover:-translate-y-1 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-5 group"
          >
            {/* Card Top Info */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {project.codigoProyecto && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-950/80 text-red-400 border border-red-800">
                      {project.codigoProyecto}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {project.categoria}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white leading-tight mt-0.5">
                  {project.nombre}
                </h3>
                <p className="text-xs font-semibold text-amber-400 mt-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{project.cliente}</span>
                </p>
              </div>

              {/* Status Switcher Dropdown */}
              <select
                value={project.estado}
                onChange={(e) => handleChangeStatus(project.id, e.target.value as ProjectStatusType)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer focus:outline-none ${getStatusBadgeClass(
                  project.estado
                )}`}
              >
                <option value="Liquidado" className="bg-neutral-900 text-emerald-400">🟢 Liquidado (Pago $0)</option>
                <option value="Pagado" className="bg-neutral-900 text-emerald-400">🟢 Pagado Completo</option>
                <option value="Entregado" className="bg-neutral-900 text-slate-200">Entregado</option>
                <option value="Listo para Revisión" className="bg-neutral-900 text-slate-200">Listo para Revisión</option>
                <option value="En Mezcla" className="bg-neutral-900 text-slate-200">En Mezcla</option>
                <option value="En Grabación" className="bg-neutral-900 text-slate-200">En Grabación</option>
                <option value="En Producción" className="bg-neutral-900 text-slate-200">En Producción</option>
                <option value="En Cotización" className="bg-neutral-900 text-slate-200">En Cotización</option>
                <option value="En Diseño" className="bg-neutral-900 text-slate-200">En Diseño</option>
                <option value="En Revisión" className="bg-neutral-900 text-slate-200">En Revisión</option>
                <option value="Pausado" className="bg-neutral-900 text-slate-200">Pausado</option>
              </select>
            </div>

            {/* Panel de Control de Saldo & Desbloqueo de Bóveda (WAV/Stems) */}
            {(() => {
              const isProjectPaid = (project.balancePendiente ?? 0) <= 0 || 
                                    project.estado === 'Liquidado' || 
                                    project.estado === 'Pagado' || 
                                    project.estado === 'Entregado';
              const pendingAmt = isProjectPaid ? 0 : (project.balancePendiente ?? Math.round(project.montoTotal * 0.5));

              return (
                <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isProjectPaid
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg border ${
                      isProjectPaid 
                        ? 'bg-emerald-950 border-emerald-700 text-emerald-400' 
                        : 'bg-amber-950 border-amber-700 text-amber-400'
                    }`}>
                      {isProjectPaid ? <CheckSquare className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider">
                          {isProjectPaid ? 'ESTADO FINANCIERO: LIQUIDADO ($0 PENDIENTE)' : `SALDO PENDIENTE: $${pendingAmt} USD`}
                        </span>
                        <span className={`px-1.5 py-0.2 text-[9px] font-black rounded border font-mono ${
                          isProjectPaid 
                            ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600' 
                            : 'bg-red-950 text-red-300 border-red-800'
                        }`}>
                          {isProjectPaid ? '🔓 BÓVEDA DESBLOQUEADA' : '🔒 WAV & STEMS BLOQUEADOS'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {isProjectPaid 
                          ? 'El cliente tiene acceso total para descargar Máster WAV 24-bit, Acapellas, Instrumentales y Stems multitrack.' 
                          : 'El cliente solo puede escuchar el MP3 streaming. La descarga de archivos finales de estudio permanece bloqueada.'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isProjectPaid ? (
                      <button
                        type="button"
                        onClick={() => {
                          const reopenedAmt = Math.round(project.montoTotal * 0.5);
                          setProjects(prev => prev.map(p => {
                            if (p.id === project.id) {
                              return {
                                ...p,
                                balancePendiente: reopenedAmt,
                                estado: 'En Revisión' as ProjectStatusType
                              };
                            }
                            return p;
                          }));
                          showToast(`Saldo de "${project.nombre}" reabierto ($${reopenedAmt} USD pendiente)`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-700 text-[10px] font-bold uppercase transition cursor-pointer"
                        title="Reabrir saldo pendiente para este proyecto"
                      >
                        Reabrir Saldo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setProjects(prev => prev.map(p => {
                            if (p.id === project.id) {
                              return {
                                ...p,
                                balancePendiente: 0,
                                depositoPagado: project.montoTotal,
                                estado: 'Liquidado' as ProjectStatusType
                              };
                            }
                            return p;
                          }));
                          showToast(`✨ ¡"${project.nombre}" marcado como LIQUIDADO! Archivos WAV y Stems desbloqueados.`);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Marcar como pagado y desbloquear descargas para el cliente"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Marcar como Liquidado ($0)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-neutral-400">Progreso del Proyecto</span>
                <span className="text-amber-400">{project.progreso}%</span>
              </div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-red-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${project.progreso}%` }}
                />
              </div>
            </div>

            {/* Estado Técnico (Track Tracker) Selector para el Artista */}
            <div className="bg-[#18181b] p-3 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                🚦 Estado Técnico (Track Tracker)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { label: '🔴 Grabado', val: 25, est: 'Grabado (Voces Listas)' },
                  { label: '🟡 Mezclándose', val: 50, est: 'En Mezcla' },
                  { label: '🔵 Master', val: 80, est: 'Masterización Final' },
                  { label: '🟢 ¡Lista! 🎉', val: 100, est: '¡Lista para Descargar! 🎉' }
                ].map((step) => {
                  const estL = (project.estado || '').toLowerCase();
                  const currentStepIdx = project.progreso >= 100 || estL.includes('completado') || estL.includes('terminado') || estL.includes('entregado') || estL.includes('lista') || estL.includes('descargar') ? 3 :
                                        estL.includes('master') || estL.includes('mast') || project.progreso > 75 ? 2 :
                                        estL.includes('mezc') || estL.includes('mix') || project.progreso > 35 ? 1 : 0;
                  const stepIdx = step.val === 25 ? 0 : step.val === 50 ? 1 : step.val === 80 ? 2 : 3;
                  const isCurrent = currentStepIdx === stepIdx;

                  return (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => {
                        setProjects(prev => prev.map(p => {
                          if (p.id === project.id) {
                            return { ...p, progreso: step.val, estado: step.est as ProjectStatusType };
                          }
                          return p;
                        }));
                        showToast(`Semáforo de "${project.nombre}" actualizado a: ${step.label.slice(2)}`);
                      }}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition text-center focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                        isCurrent
                          ? 'bg-amber-500 text-gray-950 border-amber-400 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                          : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      {step.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Milestones Checklist */}
            <div className="space-y-2 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                Hitos Clave ({project.hitos.filter(h => h.completado).length}/{project.hitos.length}):
              </span>

              <div className="space-y-1.5">
                {project.hitos.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMilestone(project.id, m.id)}
                    className="flex items-center gap-2 text-xs cursor-pointer hover:text-white transition-colors group"
                  >
                    {m.completado ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 flex-shrink-0" />
                    )}
                    <span className={m.completado ? 'line-through text-neutral-500' : 'text-neutral-200 font-medium'}>
                      {m.titulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800 text-xs">
              <div className="space-y-1">
                <div className="text-neutral-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Entrega: <strong className="text-neutral-200">{project.fechaEntrega}</strong></span>
                </div>
                <div className="text-neutral-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Lead: <strong className="text-neutral-200">{project.liderCreativo}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span className="text-base font-bold text-white mr-1">
                  {project.moneda} {project.montoTotal.toLocaleString()}
                </span>

                <button
                  onClick={() => setSelectedContractProject(project)}
                  className="px-2.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-400 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Generar Contrato PDF para este Cliente"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Contrato PDF</span>
                </button>

                <button
                  onClick={() => onAskGeminiForProject(project)}
                  className="p-2 rounded-xl bg-neutral-800 text-amber-400 hover:bg-neutral-700 border border-neutral-700 transition-colors"
                  title="Consultar Estrategia con IA"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="p-2 rounded-xl text-neutral-500 hover:text-rose-400 transition-colors"
                  title="Eliminar proyecto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo Proyecto */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Kanban className="w-5 h-5 text-red-500" />
                <span>Registrar Nuevo Proyecto</span>
              </h3>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Producción de Álbum Completo / Grabación de EP"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sofía Valenzuela"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-red-500"
                  >
                    <option value="Grabación de Voces / Tracking">Grabación de Voces / Tracking</option>
                    <option value="Producción de Beat / Instrumental">Producción de Beat / Instrumental</option>
                    <option value="Mezcla & Masterización">Mezcla & Masterización</option>
                    <option value="Producción Integral / Completa">Producción Integral / Completa</option>
                    <option value="Edición & Afinación Vocal">Edición & Afinación Vocal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    value={newMonto}
                    onChange={(e) => setNewMonto(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Líder
                  </label>
                  <input
                    type="text"
                    value={newLead}
                    onChange={(e) => setNewLead(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Entrega
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Generador de Contratos PDF */}
      {selectedContractProject && (
        <ContractModal
          project={selectedContractProject}
          onClose={() => setSelectedContractProject(null)}
        />
      )}

    </div>
  );
};
