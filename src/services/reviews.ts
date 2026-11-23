import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface StudioReview {
  id: string;
  artistName: string;
  projectTitle: string;
  quote: string;
  rating: number;
  featured: boolean;
  featuredOrder?: number | null;
  source?: string;
  createdAt: number;
}

export const DEFAULT_VERIFIED_REVIEWS: StudioReview[] = [
  {
    id: 'zyron-mix-master',
    rating: 5,
    quote: 'Suena cabron! Papi quedó cm mejor es posible, no le hace falta nada.',
    artistName: 'Zyron',
    projectTitle: 'Mix y Máster · WhatsApp',
    featured: true,
    featuredOrder: 0,
    source: 'WhatsApp Verificado',
    createdAt: 1763800000000,
  },
  {
    id: 'k-lead-grabacion',
    rating: 5,
    quote: 'El último tema que me grabaste allí me pasó escuchando… la calidad está mortal.',
    artistName: 'K Lead',
    projectTitle: 'Grabación en el estudio · WhatsApp',
    featured: true,
    featuredOrder: 1,
    source: 'WhatsApp Verificado',
    createdAt: 1763790000000,
  },
  {
    id: 'jvo-the-writer-adelanto',
    rating: 5,
    quote: 'Durolllllll. 🔥🔥🔥🫡🫡',
    artistName: 'JVO The Writer',
    projectTitle: 'Adelanto de Sesión · WhatsApp',
    featured: true,
    featuredOrder: 2,
    source: 'WhatsApp Verificado',
    createdAt: 1763780000000,
  },
];

const STORAGE_KEY = 'la_facultad_reviews_cache_v1';
const REVIEWS_UPDATED_EVENT = 'la_facultad_reviews_updated';
const REVIEWS_COLLECTION = 'reviews';

function readCachedReviews(): StudioReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VERIFIED_REVIEWS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore storage errors
  }
  return DEFAULT_VERIFIED_REVIEWS;
}

function writeCachedReviews(items: StudioReview[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(REVIEWS_UPDATED_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function getFeaturedHomeReviews(allReviews: StudioReview[]): StudioReview[] {
  const featured = allReviews
    .filter((r) => r.featured)
    .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99));

  if (featured.length > 0) {
    return featured.slice(0, 3);
  }
  return allReviews.slice(0, 3);
}

export function subscribeToReviews(callback: (reviews: StudioReview[]) => void): () => void {
  callback(readCachedReviews());

  const handleLocalSync = () => callback(readCachedReviews());
  window.addEventListener(REVIEWS_UPDATED_EVENT, handleLocalSync);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), orderBy('createdAt', 'desc'));
    unsubFirestore = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          callback(DEFAULT_VERIFIED_REVIEWS);
          return;
        }
        const list: StudioReview[] = snap.docs.map((d) => {
          const data = d.data() as Partial<StudioReview>;
          return {
            id: d.id,
            artistName: String(data.artistName || 'Artista'),
            projectTitle: String(data.projectTitle || 'Sesión en La Facultad'),
            quote: String(data.quote || ''),
            rating: Number(data.rating || 5),
            featured: Boolean(data.featured),
            featuredOrder: typeof data.featuredOrder === 'number' ? data.featuredOrder : null,
            source: typeof data.source === 'string' ? data.source : 'Web /review',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          };
        });
        writeCachedReviews(list);
        callback(list);
      },
      () => {
        callback(readCachedReviews());
      }
    );
  } catch {
    callback(readCachedReviews());
  }

  return () => {
    window.removeEventListener(REVIEWS_UPDATED_EVENT, handleLocalSync);
    unsubFirestore();
  };
}

export async function submitPublicReview(input: {
  artistName: string;
  projectTitle: string;
  quote: string;
  rating: number;
}): Promise<StudioReview> {
  const id = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const cleanReview: StudioReview = {
    id,
    artistName: input.artistName.trim().slice(0, 60),
    projectTitle: input.projectTitle.trim().slice(0, 80),
    quote: input.quote.trim().slice(0, 400),
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    featured: false,
    featuredOrder: null,
    source: 'Web /review',
    createdAt: Date.now(),
  };

  await setDoc(doc(db, REVIEWS_COLLECTION, id), {
    artistName: cleanReview.artistName,
    projectTitle: cleanReview.projectTitle,
    quote: cleanReview.quote,
    rating: cleanReview.rating,
    featured: false,
    featuredOrder: null,
    source: cleanReview.source,
    createdAt: cleanReview.createdAt,
  });

  const current = readCachedReviews();
  writeCachedReviews([cleanReview, ...current.filter((r) => r.id !== id)]);
  return cleanReview;
}

export async function seedDefaultReviewsIfNeeded(current: StudioReview[]): Promise<void> {
  const batch = writeBatch(db);
  for (const item of DEFAULT_VERIFIED_REVIEWS) {
    if (!current.some((r) => r.id === item.id)) {
      batch.set(doc(db, REVIEWS_COLLECTION, item.id), {
        artistName: item.artistName,
        projectTitle: item.projectTitle,
        quote: item.quote,
        rating: item.rating,
        featured: item.featured,
        featuredOrder: item.featuredOrder ?? null,
        source: item.source ?? 'WhatsApp Verificado',
        createdAt: item.createdAt,
      });
    }
  }
  await batch.commit();
}

export async function setFeaturedHomeReviews(
  allReviews: StudioReview[],
  selectedIds: string[]
): Promise<void> {
  const limited = selectedIds.slice(0, 3);
  const batch = writeBatch(db);

  for (const rev of allReviews) {
    const orderIdx = limited.indexOf(rev.id);
    const shouldFeature = orderIdx !== -1;
    batch.set(
      doc(db, REVIEWS_COLLECTION, rev.id),
      {
        artistName: rev.artistName,
        projectTitle: rev.projectTitle,
        quote: rev.quote,
        rating: rev.rating,
        featured: shouldFeature,
        featuredOrder: shouldFeature ? orderIdx : null,
        source: rev.source || 'Web /review',
        createdAt: rev.createdAt,
      },
      { merge: true }
    );
  }

  await batch.commit();

  const updated = allReviews.map((r) => {
    const orderIdx = limited.indexOf(r.id);
    return {
      ...r,
      featured: orderIdx !== -1,
      featuredOrder: orderIdx !== -1 ? orderIdx : null,
    };
  });
  writeCachedReviews(updated);
}

export async function deleteStudioReview(reviewId: string, allReviews: StudioReview[]): Promise<void> {
  await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
  writeCachedReviews(allReviews.filter((r) => r.id !== reviewId));
}

export async function toggleSingleReviewFeatured(
  review: StudioReview,
  featured: boolean,
  featuredOrder: number | null = null
): Promise<void> {
  await updateDoc(doc(db, REVIEWS_COLLECTION, review.id), {
    featured,
    featuredOrder,
  });
}
