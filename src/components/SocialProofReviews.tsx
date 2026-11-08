import React from 'react';
import { Star, ShieldCheck, CheckCircle2, Headphones, MapPin, Sparkles, Clock, Calendar } from 'lucide-react';

interface ReviewItem {
  id: string;
  artistName: string;
  realName: string;
  location: string;
  trackTitle: string;
  sessionType: string;
  rating: number;
  date: string;
  comment: string;
  highlight: string;
}

const REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    artistName: 'Kevvo R. "D-Flow"',
    realName: 'Kevin Rivera',
    location: 'Mayagüez, PR',
    trackTitle: 'Luz (Single Urbano)',
    sessionType: 'Bloque Promo 4 Horas + Mezcla',
    rating: 5,
    date: 'Hace 1 semana',
    comment: 'La diferencia de grabar con el Neumann TLM 103 en el studio de Badlenz es del cielo a la tierra. No tuve que esperar semanas por la mezcla; en 48 horas tenía el WAV masterizado sonando al nivel de lo que suena en la radio.',
    highlight: 'Afinación Melodyne quirúrgica y brillo vocal sin sibilancia.'
  },
  {
    id: 'r2',
    artistName: 'Jayden "El Melódico"',
    realName: 'Jayden Cruz',
    location: 'Hormigueros, PR',
    trackTitle: 'Dilema de Amor (Reggaetón)',
    sessionType: 'Sesión Pro + Master Comercial',
    rating: 5,
    date: 'Hace 2 semanas',
    comment: 'Badlenz no solo le da REC al Pro Tools, te dirige la voz, te dice dónde meter el aire y qué armonías doblar. Pagar el 50% por ATH Móvil fue súper fácil y seguro. Vuelvo el mes que viene a grabar el EP completo.',
    highlight: 'Dirección vocal 1 a 1 de productor real, no un operador.'
  },
  {
    id: 'r3',
    artistName: 'Niko PR',
    realName: 'Nicolás Vega',
    location: 'San Germán, PR',
    trackTitle: 'Ruta 100 (Trap Latino)',
    sessionType: 'Full Pack (Beat Badlenz + Voces)',
    rating: 5,
    date: 'Hace 3 semanas',
    comment: 'El beat que me montó Badlenz en sesión estaba durísimo, los 808s rompen en la guagua y en los audífonos con una pegada limpia. La acústica del studio es seca y profesional, sin eco ni ruidos de la calle.',
    highlight: '808s con pegada pesada calibrados en monitores Focal.'
  },
  {
    id: 'r4',
    artistName: 'Yovng Flex',
    realName: 'Félix Maldonado',
    location: 'Cabo Rojo, PR',
    trackTitle: 'Sensación (Dembow Drill)',
    sessionType: 'Bloque Promo 4 Horas',
    rating: 5,
    date: 'El mes pasado',
    comment: 'Tuve un percance con el carro el día antes y Badlenz me movió la sesión sin ningún problema ni cobrarme extra. La seriedad y el respeto por el artista aquí es otro nivel. Recomendado 100% a todos los del oeste.',
    highlight: 'Puntualidad, trato profesional y cero sorpresas en precio.'
  }
];

export const SocialProofReviews: React.FC = () => {
  return (
    <section id="testimonios" className="space-y-6">
      {/* Header de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#1e2230] pb-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase block">
            EXPERIENCIAS EN EL STUDIO &amp; REPUTACIÓN LOCAL
          </span>
          <h2 className="text-2xl sm:text-3xl font-display uppercase tracking-wide text-white mt-1">
            LO QUE DICEN LOS <span className="text-red-500">ARTISTAS DE PUERTO RICO</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl font-body">
            Calificaciones reales de cantantes y productores independientes del área oeste y la isla que graban en La Facultad Studio.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0f1118] px-3.5 py-2 rounded-xl border border-[#1e2230] text-xs font-mono text-gray-300 self-start sm:self-auto">
          <div className="flex text-amber-400" aria-label="5 de 5 estrellas">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="font-bold text-white">5.0 / 5.0</span>
          <span className="text-gray-500">·</span>
          <span className="text-emerald-400 font-bold">100% Recomendado</span>
        </div>
      </div>

      {/* Grid de Reseñas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REVIEWS.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl border border-[#1c1f2e] bg-gradient-to-b from-[#11131d] to-[#090a12] p-5 sm:p-6 space-y-4 hover:border-[#2a2e45] transition-all shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Top metadata */}
              <div className="flex items-start justify-between gap-2 border-b border-[#1e2230]/60 pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-white text-sm font-bold block">{review.artistName}</strong>
                    <span className="text-[10px] text-gray-400 font-mono">({review.realName})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono mt-0.5">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>{review.location}</span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-300">{review.sessionType}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex text-amber-400 justify-end" aria-hidden="true">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono block mt-0.5">{review.date}</span>
                </div>
              </div>

              {/* Comentario */}
              <p className="text-xs text-gray-300 font-body leading-relaxed italic">
                "{review.comment}"
              </p>
            </div>

            {/* Highlight & Sello Verificado */}
            <div className="pt-3 border-t border-[#1e2230]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{review.highlight}</span>
              </span>

              <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg flex items-center gap-1 self-start sm:self-auto font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Sesión Verificada</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CLÁUSULA HUMANA DE TRANQUILIDAD Y REPROGRAMACIÓN */}
      <div className="bg-gradient-to-r from-red-950/30 via-[#0d1017] to-amber-950/20 p-4 sm:p-5 rounded-2xl border border-[#2a2e45] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <strong className="text-white text-xs sm:text-sm font-bold block uppercase tracking-wide">
              Política Flexible de Emergencias Badlenz
            </strong>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
              Sabemos que la vida pasa. Si tienes un contratiempo o emergencia personal, avísanos con al menos <strong>24 horas de anticipación</strong> y reprogramamos tu sesión para la fecha que prefieras <strong>sin perder tu depósito de ATH Móvil</strong>.
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/17872408627?text=¡Saludos%20Badlenz!%20Tengo%20una%20pregunta%20sobre%20mi%20sesión%20de%20grabación%20en%20Hormigueros."
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-[#141824] hover:bg-[#1e2336] text-gray-200 border border-gray-700 font-bold text-[11px] whitespace-nowrap transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <span>Consultar por WhatsApp</span>
          <span>➔</span>
        </a>
      </div>
    </section>
  );
};

export default SocialProofReviews;
