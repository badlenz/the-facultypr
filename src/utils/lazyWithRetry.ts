import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Robust lazy wrapper that retries dynamic imports if network drops or Vite dev server restarts.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>,
  retries = 2,
  interval = 500
): LazyExoticComponent<T> {
  return lazy(async () => {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const module = await factory();
        if (module && module.default) {
          return module;
        }
        // If named export was used instead of default
        const keys = Object.keys(module || {});
        for (const key of keys) {
          if (typeof module[key] === 'function' || (typeof module[key] === 'object' && module[key] !== null)) {
            return { default: module[key] };
          }
        }
        return module;
      } catch (err: any) {
        attempt++;
        const isDynamicImportError =
          err?.message?.includes('dynamically imported module') ||
          err?.message?.includes('Failed to fetch') ||
          err?.name === 'ChunkLoadError';

        console.warn(`[La Facultad Studio] Error cargando módulo (intento ${attempt}/${retries + 1}):`, err);

        if (attempt > retries) {
          // If all attempts failed and it's a chunk mismatch, trigger a one-time clean reload
          if (isDynamicImportError && typeof window !== 'undefined') {
            const reloaded = sessionStorage.getItem('chunk_auto_reload');
            if (!reloaded) {
              sessionStorage.setItem('chunk_auto_reload', 'true');
              window.location.reload();
            }
          }
          throw err;
        }

        await new Promise((resolve) => setTimeout(resolve, interval * attempt));
      }
    }
    throw new Error('No se pudo cargar el módulo dinámico.');
  });
}
