import React, { useMemo, useState } from 'react';
import {
  Award,
  Check,
  Cloud,
  ExternalLink,
  RotateCcw,
  Search,
  Youtube,
} from 'lucide-react';
import {
  BADLENZ_VERIFIED_CREDITS,
  CreditRoleKey,
} from '../data/badlenzVerifiedCredits';
import {
  EDITABLE_ROLES,
  resetCreditRoleOverride,
  saveCreditRoleOverride,
  useResolvedBadlenzCredits,
} from '../services/creditsRoles';

interface AdminCreditsRolesEditorProps {
  onNotify: (msg: string) => void;
}

type FilterMode = 'ALL' | 'CUSTOMIZED' | CreditRoleKey | 'BMG';

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString('en-US');
}

export const AdminCreditsRolesEditor: React.FC<AdminCreditsRolesEditorProps> = ({
  onNotify,
}) => {
  const { credits, overrides, customizedCount } = useResolvedBadlenzCredits();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [savingTrackId, setSavingTrackId] = useState<string | null>(null);

  const defaultRolesById = useMemo(() => {
    const map: Record<string, CreditRoleKey[]> = {};
    for (const c of BADLENZ_VERIFIED_CREDITS) {
      map[c.id] = c.roles;
    }
    return map;
  }, []);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: credits.length,
      CUSTOMIZED: customizedCount,
      Producer: 0,
      Engineer: 0,
      Mastering: 0,
      Songwriter: 0,
      BMG: 0,
    };
    for (const c of credits) {
      if (c.source === 'BMG') counts.BMG += 1;
      for (const r of c.roles) {
        if (counts[r] !== undefined) counts[r] += 1;
      }
    }
    return counts;
  }, [credits, customizedCount]);

  const filteredCredits = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    return credits.filter((c) => {
      if (filterMode === 'CUSTOMIZED' && !overrides[c.id]) return false;
      if (filterMode === 'BMG' && c.source !== 'BMG') return false;
      if (
        filterMode !== 'ALL' &&
        filterMode !== 'CUSTOMIZED' &&
        filterMode !== 'BMG' &&
        !c.roles.includes(filterMode)
      ) {
        return false;
      }
      if (q) {
        const hay = normalizeText(
          `${c.title} ${c.artists} ${c.album} ${c.label} ${c.roleLabels.join(' ')}`
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [credits, overrides, filterMode, searchQuery]);

  const handleToggleRole = async (
    trackId: string,
    trackTitle: string,
    currentRoles: CreditRoleKey[],
    roleKey: CreditRoleKey
  ) => {
    const hasRole = currentRoles.includes(roleKey);
    if (hasRole && currentRoles.length === 1) {
      onNotify('Cada tema debe mantener al menos 1 rol activo.');
      return;
    }

    const nextRoles = hasRole
      ? currentRoles.filter((r) => r !== roleKey)
      : [...currentRoles, roleKey];

    // Sort roles consistently according to EDITABLE_ROLES order
    const order = EDITABLE_ROLES.map((r) => r.key);
    nextRoles.sort((a, b) => order.indexOf(a) - order.indexOf(b));

    setSavingTrackId(trackId);
    try {
      const result = await saveCreditRoleOverride(trackId, nextRoles);
      const labels = nextRoles
        .map((rk) => EDITABLE_ROLES.find((o) => o.key === rk)?.label || rk)
        .join(' · ');
      onNotify(
        result.syncedToCloud
          ? `Rol actualizado en "${trackTitle}": ${labels} (Firestore Cloud Sync)`
          : `Rol guardado localmente en "${trackTitle}": ${labels}`
      );
    } finally {
      setSavingTrackId(null);
    }
  };

  const handleResetTrack = async (trackId: string, trackTitle: string) => {
    setSavingTrackId(trackId);
    try {
      await resetCreditRoleOverride(trackId);
      onNotify(`Rol original restaurado en "${trackTitle}".`);
    } finally {
      setSavingTrackId(null);
    }
  };

  const filterButtons: { key: FilterMode; label: string }[] = [
    { key: 'ALL', label: 'Todos' },
    { key: 'CUSTOMIZED', label: 'Editados' },
    { key: 'Producer', label: 'Productor' },
    { key: 'Engineer', label: 'Mezcla' },
    { key: 'Mastering', label: 'Mastering' },
    { key: 'Songwriter', label: 'Compositor' },
    { key: 'BMG', label: 'BMG' },
  ];

  return (
    <div className="rounded-3xl bg-[#0e1018] border border-white/10 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm sm:text-base font-syne font-bold uppercase tracking-wider text-white">
              Editor de Roles · Catálogo Verificado ({credits.length})
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Marca uno o varios roles por canción (<strong className="text-zinc-200">Productor</strong>,{' '}
            <strong className="text-zinc-200">Mezcla</strong>,{' '}
            <strong className="text-zinc-200">Mastering</strong> o{' '}
            <strong className="text-zinc-200">Compositor</strong>). Se sincronizan en vivo con la web pública.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-700/40 text-[11px] font-mono text-emerald-300">
            <Cloud className="w-3.5 h-3.5" />
            <span>{customizedCount} editados</span>
          </span>
          <a
            href="/creditos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-xs font-mono text-amber-300 transition"
          >
            <span>Ver Catálogo Público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterButtons.map((fb) => (
            <button
              key={fb.key}
              type="button"
              onClick={() => setFilterMode(fb.key)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition cursor-pointer ${
                filterMode === fb.key
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
              }`}
            >
              {fb.label} ({roleCounts[fb.key] ?? 0})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar canción o artista para asignar Mastering, Mezcla, Productor o Compositor..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Editable Tracks List */}
      <div className="max-h-[600px] overflow-y-auto pr-1 space-y-2">
        {filteredCredits.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-xs text-zinc-400">
            No hay temas que coincidan con tu búsqueda o filtro.
          </div>
        )}

        {filteredCredits.map((track, idx) => {
          const isCustomized = Boolean(overrides[track.id]);
          const isSaving = savingTrackId === track.id;
          const defaultRoles = defaultRolesById[track.id] || [];

          return (
            <div
              key={track.id}
              className={`rounded-2xl border p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition ${
                isCustomized
                  ? 'bg-amber-950/15 border-amber-500/35'
                  : 'bg-black/35 border-white/8 hover:border-white/15'
              }`}
            >
              {/* Track Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="hidden sm:inline-block w-6 text-center font-mono text-[11px] text-zinc-500">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                  {track.albumArt ? (
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                      {track.title[0]}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-syne font-bold text-sm text-white truncate">
                      {track.title}
                    </span>
                    {isCustomized && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300">
                        Editado
                      </span>
                    )}
                    {track.youtubeViews && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                        <Youtube className="w-3 h-3 text-red-400" />
                        {formatCompact(track.youtubeViews)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {track.artists} <span className="text-zinc-600">· {track.year}</span>
                  </div>
                </div>
              </div>

              {/* 4 Multi-select Role Toggles + Reset */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {EDITABLE_ROLES.map((opt) => {
                  const active = track.roles.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        handleToggleRole(track.id, track.title, track.roles, opt.key)
                      }
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition cursor-pointer disabled:opacity-60 ${
                        active
                          ? 'bg-gradient-to-r from-red-600/90 to-amber-600/80 border-amber-400/60 text-white shadow-sm'
                          : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-amber-200" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}

                {isCustomized && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleResetTrack(track.id, track.title)}
                    title={`Restaurar rol original (${defaultRoles.join(', ')})`}
                    className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-amber-300 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCreditsRolesEditor;
