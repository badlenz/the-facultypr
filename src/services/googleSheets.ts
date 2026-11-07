import { QuoteData, StudioProject } from '../types';

export interface SheetsSyncResponse {
  success: boolean;
  message?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
  simulated?: boolean;
}

export async function checkGoogleSheetsStatus(): Promise<{ configured: boolean; message: string }> {
  try {
    const res = await fetch('/api/google-sheets/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Error checking Google Sheets status:', err);
  }
  return { configured: false, message: 'Google Sheets API no configurado.' };
}

export async function syncQuoteToGoogleSheets(quote: QuoteData): Promise<SheetsSyncResponse> {
  try {
    const res = await fetch('/api/google-sheets/sync-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote }),
    });

    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json();
      return { success: false, error: err.error || 'Error al conectar con Google Sheets' };
    }
  } catch (err: any) {
    console.error('Error enviando cotización a Google Sheets:', err);
    return { success: false, error: err?.message || 'Error de red' };
  }
}

export async function syncProjectToGoogleSheets(project: StudioProject): Promise<SheetsSyncResponse> {
  try {
    const res = await fetch('/api/google-sheets/sync-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    });

    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json();
      return { success: false, error: err.error || 'Error al conectar con Google Sheets' };
    }
  } catch (err: any) {
    console.error('Error enviando proyecto a Google Sheets:', err);
    return { success: false, error: err?.message || 'Error de red' };
  }
}

export async function syncAllToGoogleSheets(quotes: QuoteData[], projects: StudioProject[]): Promise<SheetsSyncResponse> {
  try {
    const res = await fetch('/api/google-sheets/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotes, projects }),
    });

    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json();
      return { success: false, error: err.error || 'Error al sincronizar datos masivos' };
    }
  } catch (err: any) {
    console.error('Error en sincronización masiva a Google Sheets:', err);
    return { success: false, error: err?.message || 'Error de red' };
  }
}
