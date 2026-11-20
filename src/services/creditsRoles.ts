import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  BADLENZ_VERIFIED_CREDITS,
  CreditRoleKey,
  VerifiedCreditItem,
} from '../data/badlenzVerifiedCredits';

export interface EditableRoleOption {
  key: CreditRoleKey;
  label: string;
}

export const EDITABLE_ROLES: EditableRoleOption[] = [
  { key: 'Producer', label: 'Productor' },
  { key: 'Engineer', label: 'Mezcla' },
  { key: 'Mastering', label: 'Mastering' },
  { key: 'Songwriter', label: 'Compositor' },
];

export const ROLE_LABEL_MAP: Record<CreditRoleKey, string> = {
  Producer: 'Productor',
  Engineer: 'Mezcla',
  Mastering: 'Mastering',
  Songwriter: 'Compositor',
};

export type CreditRoleOverridesMap = Record<string, CreditRoleKey[]>;

const STORAGE_KEY_CREDIT_ROLES = 'la_facultad_credit_role_overrides_db';
export const CREDIT_ROLES_UPDATED_EVENT = 'la_facultad_credit_roles_updated';
const FIRESTORE_DOC_REF = () => doc(db, 'studio_config', 'credit_role_overrides');

const VALID_ROLE_SET = new Set<CreditRoleKey>([
  'Producer',
  'Engineer',
  'Mastering',
  'Songwriter',
]);

function sanitizeRoles(raw: unknown): CreditRoleKey[] {
  if (!Array.isArray(raw)) return [];
  const unique: CreditRoleKey[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && VALID_ROLE_SET.has(item as CreditRoleKey)) {
      const role = item as CreditRoleKey;
      if (!unique.includes(role)) unique.push(role);
    }
  }
  return unique;
}

function sanitizeOverridesMap(raw: unknown): CreditRoleOverridesMap {
  if (!raw || typeof raw !== 'object') return {};
  const clean: CreditRoleOverridesMap = {};
  for (const [trackId, roles] of Object.entries(raw as Record<string, unknown>)) {
    const valid = sanitizeRoles(roles);
    if (trackId && valid.length > 0) {
      clean[trackId] = valid;
    }
  }
  return clean;
}

function dispatchRolesUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CREDIT_ROLES_UPDATED_EVENT));
  }
}

export function getCreditRoleOverrides(): CreditRoleOverridesMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREDIT_ROLES);
    if (!raw) return {};
    return sanitizeOverridesMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

let listenerStarted = false;

export function iniciarSyncCreditRoleOverrides(): void {
  if (listenerStarted || typeof window === 'undefined') return;
  listenerStarted = true;
  try {
    onSnapshot(
      FIRESTORE_DOC_REF(),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { overrides?: unknown };
          const clean = sanitizeOverridesMap(data?.overrides);
          localStorage.setItem(STORAGE_KEY_CREDIT_ROLES, JSON.stringify(clean));
          dispatchRolesUpdated();
        }
      },
      (err) => {
        console.warn('Firestore credit_role_overrides sync notice:', err.message);
      }
    );
  } catch (err) {
    console.warn('credit_role_overrides listener init notice:', err);
  }
}

export interface SaveRoleResult {
  overrides: CreditRoleOverridesMap;
  syncedToCloud: boolean;
}

async function persistOverrides(next: CreditRoleOverridesMap): Promise<SaveRoleResult> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CREDIT_ROLES, JSON.stringify(next));
    dispatchRolesUpdated();
  }

  try {
    await setDoc(
      FIRESTORE_DOC_REF(),
      {
        overrides: next,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return { overrides: next, syncedToCloud: true };
  } catch (err) {
    console.warn('Firestore saveCreditRoleOverrides notice:', err);
    return { overrides: next, syncedToCloud: false };
  }
}

export async function saveCreditRoleOverride(
  trackId: string,
  roles: CreditRoleKey[]
): Promise<SaveRoleResult> {
  const valid = sanitizeRoles(roles);
  const current = getCreditRoleOverrides();
  const next: CreditRoleOverridesMap = { ...current };

  if (valid.length === 0) {
    delete next[trackId];
  } else {
    next[trackId] = valid;
  }

  return persistOverrides(next);
}

export async function resetCreditRoleOverride(trackId: string): Promise<SaveRoleResult> {
  const current = getCreditRoleOverrides();
  if (!(trackId in current)) {
    return { overrides: current, syncedToCloud: true };
  }
  const next = { ...current };
  delete next[trackId];
  return persistOverrides(next);
}

export function resolveCreditsWithOverrides(
  credits: VerifiedCreditItem[],
  overrides: CreditRoleOverridesMap
): VerifiedCreditItem[] {
  return credits.map((item) => {
    const customRoles = overrides[item.id];
    const effectiveRoles =
      customRoles && customRoles.length > 0 ? customRoles : item.roles;
    const roleLabels = effectiveRoles.map((role) => ROLE_LABEL_MAP[role] || role);

    return {
      ...item,
      roles: effectiveRoles,
      roleLabels,
    };
  });
}

export function useResolvedBadlenzCredits() {
  const [overrides, setOverrides] = useState<CreditRoleOverridesMap>(() =>
    getCreditRoleOverrides()
  );

  useEffect(() => {
    iniciarSyncCreditRoleOverrides();
    const handleSync = () => setOverrides(getCreditRoleOverrides());
    window.addEventListener(CREDIT_ROLES_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(CREDIT_ROLES_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const credits = useMemo(
    () => resolveCreditsWithOverrides(BADLENZ_VERIFIED_CREDITS, overrides),
    [overrides]
  );

  const customizedCount = useMemo(() => Object.keys(overrides).length, [overrides]);

  return {
    credits,
    overrides,
    customizedCount,
  };
}
