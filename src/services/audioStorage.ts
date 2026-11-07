// Storage local para archivos de audio pesados (MP3, WAV) usando IndexedDB
// Evita el error QuotaExceededError de localStorage (límite de 5MB)

const DB_NAME = 'la_facultad_audio_db';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este navegador'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Caché de Blob URLs en memoria para evitar llamadas redundantes
const objectUrlCache = new Map<string, string>();

/**
 * Guarda un archivo de audio (File, Blob o Base64) en IndexedDB
 * Retorna un URI con prefijo "indexeddb://key"
 */
export async function saveAudioToStorage(key: string, data: Blob | File | string): Promise<string> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putRequest = store.put(data, key);
      putRequest.onsuccess = () => {
        // Limpiar URL vieja si existía
        if (objectUrlCache.has(key)) {
          try {
            URL.revokeObjectURL(objectUrlCache.get(key)!);
          } catch (e) { /* ignore */ }
          objectUrlCache.delete(key);
        }
        resolve(`indexeddb://${key}`);
      };
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.error('Error al guardar audio en IndexedDB:', err);
    throw err;
  }
}

/**
 * Obtiene la URL ejecutable para un elemento <audio src="...">
 * Si es una URL http/https normal la devuelve tal cual.
 * Si es un enlace indexeddb:// la resuelve como un blob URL local.
 */
export async function getAudioPlayableUrl(urlOrKey: string): Promise<string> {
  if (!urlOrKey) return '';
  if (!urlOrKey.startsWith('indexeddb://')) {
    return urlOrKey; // Es URL externa (https://...) o data URL corta
  }

  const key = urlOrKey.replace('indexeddb://', '');
  if (objectUrlCache.has(key)) {
    return objectUrlCache.get(key)!;
  }

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(key);
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (!result) {
          resolve('');
          return;
        }

        if (result instanceof Blob || result instanceof File) {
          const blobUrl = URL.createObjectURL(result);
          objectUrlCache.set(key, blobUrl);
          resolve(blobUrl);
        } else if (typeof result === 'string') {
          if (result.startsWith('data:audio')) {
            try {
              const arr = result.split(',');
              const mime = arr[0].match(/:(.*?);/)?.[1] || 'audio/mpeg';
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              const blob = new Blob([u8arr], { type: mime });
              const blobUrl = URL.createObjectURL(blob);
              objectUrlCache.set(key, blobUrl);
              resolve(blobUrl);
              return;
            } catch (e) {
              resolve(result);
              return;
            }
          }
          resolve(result);
        } else {
          resolve('');
        }
      };
      getRequest.onerror = () => resolve('');
    });
  } catch (err) {
    console.warn('Error leyendo audio de IndexedDB:', err);
    return '';
  }
}

/**
 * Elimina un archivo de audio de IndexedDB
 */
export async function deleteAudioFromStorage(urlOrKey: string): Promise<void> {
  if (!urlOrKey || !urlOrKey.startsWith('indexeddb://')) return;
  const key = urlOrKey.replace('indexeddb://', '');
  if (objectUrlCache.has(key)) {
    try {
      URL.revokeObjectURL(objectUrlCache.get(key)!);
    } catch (e) { /* ignore */ }
    objectUrlCache.delete(key);
  }
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch (err) {
    console.warn('Error eliminando audio de IndexedDB:', err);
  }
}
