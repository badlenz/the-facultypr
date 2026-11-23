import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, MessageSquarePlus, Quote, Send, Star } from 'lucide-react';
import {
  StudioReview,
  subscribeToReviews,
  submitPublicReview,
} from '../services/reviews';

interface ReviewPageProps {
  onBackHome: () => void;
  onBookClick: () => void;
}

const SERVICE_PRESETS = [
  'Grabación Vocal',
  'Mix y Máster',
  'Producción Completa',
  'Solo Mezcla & Master',
];

export const ReviewPage: React.FC<ReviewPageProps> = ({ onBackHome, onBookClick }) => {
  const [reviews, setReviews] = useState<StudioReview[]>([]);
  const [artistName, setArtistName] = useState('');
  const [projectTitle, setProjectTitle] = useState('Grabación Vocal');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedOk, setSubmittedOk] = useState(false);

  useEffect(() => {
    return subscribeToReviews(setReviews);
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '5.0';
    const total = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmittedOk(false);

    if (artistName.trim().length < 2) {
      setErrorMsg('Escribe tu nombre artístico o nombre (mínimo 2 caracteres).');
      return;
    }
    if (projectTitle.trim().length < 2) {
      setErrorMsg('Indica el servicio o tema que trabajaste.');
      return;
    }
    if (quote.trim().length < 8) {
      setErrorMsg('Cuéntanos un poco más de tu experiencia (mínimo 8 caracteres).');
      return;
    }

    try {
      setSubmitting(true);
      await submitPublicReview({
        artistName,
        projectTitle,
        quote,
        rating,
      });
      setArtistName('');
      setQuote('');
      setRating(5);
      setSubmittedOk(true);
    } catch {
      setErrorMsg('No se pudo guardar la reseña en este momento. Intenta de nuevo en unos segundos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#10121b]/90 border border-white/10 px-4 py-3 shadow-xl">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Volver a La Facultad Studio</span>
        </button>

        <button
          type="button"
          onClick={onBookClick}
          className="text-xs bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-syne font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition shadow-lg cursor-pointer shrink-0"
        >
          Apartar Sesión ($130 USD) →
        </button>
      </div>

      {/* Hero + Form Container */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 antigravity-glass-panel p-5 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.75)] space-y-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
        <div className="absolute -top-24 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Title & Summary */}
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-widest">
              <MessageSquarePlus className="w-3 h-3 text-amber-400" />
              <span>Reseñas Reales · Hormigueros, PR</span>
            </span>

            <h1 className="font-syne text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              ¿Grabaste con <span className="text-amber-400">Badlenz</span>? Deja tu reseña
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Tu opinión ayuda a otros artistas a conocer la calidad real de grabación, mezcla y máster en La Facultad Studio.
            </p>

            <div className="rounded-2xl border border-white/10 bg-black/45 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Calificación Promedio
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-syne text-2xl font-extrabold text-white">
                    {averageRating}
                  </span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Reseñas Publicadas
                </p>
                <p className="font-syne text-2xl font-extrabold text-amber-400 mt-0.5">
                  {reviews.length}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Interactive Review Box */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0b0d14]/90 p-5 sm:p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <h2 className="font-syne font-bold text-base sm:text-lg text-white">
                Escribe tu experiencia en cabina
              </h2>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`${star} estrellas`}
                    className="p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 transition ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400 scale-105'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label className="space-y-1.5 block">
                <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider">
                  Nombre artístico *
                </span>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Ej: Zyron, K Lead..."
                  className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider">
                  Servicio o Tema *
                </span>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Ej: Grabación Vocal · Tema X"
                  className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SERVICE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setProjectTitle(preset)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono border transition cursor-pointer ${
                    projectTitle === preset
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <label className="space-y-1.5 block">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider">
                  Tu reseña *
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {quote.length}/400
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={400}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="¿Cómo te sentiste en la sesión, la dirección vocal o el sonido final?"
                className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition resize-none"
              />
            </label>

            {errorMsg && (
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}

            {submittedOk && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>¡Gracias! Tu reseña ya quedó publicada abajo.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 disabled:opacity-50 text-white font-syne font-bold text-xs sm:text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Publicando...' : 'Publicar Reseña'}</span>
            </button>
          </form>
        </div>
      </section>

      {/* All Reviews Wall */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="font-syne text-xl sm:text-2xl font-bold text-white">
            Todas las Reseñas ({reviews.length})
          </h2>
          <span className="text-[11px] font-mono text-zinc-400">
            Ordenadas de más reciente a más antigua
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-[#0f121b]/90 hover:border-amber-400/35 p-5 flex flex-col justify-between gap-4 transition-all shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {item.featured ? (
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold">
                      En Portada
                    </span>
                  ) : (
                    <Quote className="w-4 h-4 text-zinc-600 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <p className="font-dmsans text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
                  “{item.quote}”
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-syne font-bold text-white">{item.artistName}</p>
                  <p className="font-mono text-[11px] text-amber-300/90 mt-0.5">
                    {item.projectTitle}
                  </p>
                </div>
                {item.source && (
                  <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                    {item.source}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
