import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Star, Trash2, UploadCloud } from 'lucide-react';
import {
  StudioReview,
  deleteStudioReview,
  seedDefaultReviewsIfNeeded,
  setFeaturedHomeReviews,
  subscribeToReviews,
} from '../services/reviews';

export const AdminReviewsCurator: React.FC = () => {
  const [reviews, setReviews] = useState<StudioReview[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    return subscribeToReviews((list) => {
      setReviews(list);
      const currentFeatured = list
        .filter((r) => r.featured)
        .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99))
        .slice(0, 3)
        .map((r) => r.id);
      setSelectedIds(currentFeatured);
    });
  }, []);

  const toggleSelect = (id: string) => {
    setStatusMsg(null);
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleSaveFeatured = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);
      await setFeaturedHomeReviews(reviews, selectedIds);
      setStatusMsg('Las 3 reseñas de portada se actualizaron en tiempo real.');
    } catch {
      setStatusMsg('Error al guardar en Firestore. Verifica tu sesión de administrador.');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setSaving(true);
      await seedDefaultReviewsIfNeeded(reviews);
      setStatusMsg('Reseñas verificadas iniciales sincronizadas con Firestore.');
    } catch {
      setStatusMsg('No se pudieron sincronizar las reseñas iniciales.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudioReview(id, reviews);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      setStatusMsg('Reseña eliminada.');
    } catch {
      setStatusMsg('No se pudo eliminar la reseña.');
    }
  };

  const handleCopyReviewLink = () => {
    const url = `${window.location.origin}/review`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[#0d1018] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-syne text-lg font-bold text-white">
            Reseñas de Artistas &amp; Curaduría de Portada
          </h3>
          <p className="text-xs text-zinc-400">
            Elige hasta <strong className="text-amber-300">3 reseñas</strong> para mostrar en la sección{' '}
            <span className="text-white font-semibold">“Lo Que Dicen Los Artistas”</span> de la página principal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyReviewLink}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedUrl ? 'Enlace /review copiado' : 'Copiar link /review'}</span>
          </button>

          <a
            href="/review"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Abrir /review</span>
          </a>

          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span>Sincronizar base</span>
          </button>

          <button
            type="button"
            onClick={handleSaveFeatured}
            disabled={saving || selectedIds.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 disabled:opacity-50 text-white text-xs font-syne font-bold uppercase tracking-wider cursor-pointer"
          >
            {saving ? 'Guardando...' : `Guardar Portada (${selectedIds.length}/3)`}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 font-mono">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((rev) => {
          const isFeatured = selectedIds.includes(rev.id);
          const orderNum = selectedIds.indexOf(rev.id) + 1;

          return (
            <div
              key={rev.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition ${
                isFeatured
                  ? 'border-amber-400/70 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'border-white/10 bg-[#0b0d14]'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {isFeatured && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-gray-950">
                      Portada #{orderNum}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed">“{rev.quote}”</p>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-syne font-bold text-white">{rev.artistName}</p>
                    <p className="font-mono text-[10px] text-zinc-400">{rev.projectTitle}</p>
                  </div>
                  {rev.source && (
                    <span className="text-[9px] font-mono text-zinc-500">{rev.source}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelect(rev.id)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                      isFeatured
                        ? 'bg-amber-400/20 border border-amber-400/50 text-amber-200'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300'
                    }`}
                  >
                    {isFeatured ? '✓ En Portada' : 'Elegir para Portada'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(rev.id)}
                    aria-label={`Eliminar reseña de ${rev.artistName}`}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
