import { useCallback, useMemo, useRef, useSyncExternalStore, type SetStateAction } from 'react';
import { useAccountStorage } from '@/contexts/AccountDataContext';

/** One synchronous owner-bound value shared by all mounted consumers. */
export function useAccountState<T>(key: string, initial: () => T, decode: (raw: string) => T = JSON.parse) {
  const storage = useAccountStorage();
  const fallback = useRef<{ value: T }>();
  if (!fallback.current) fallback.current = { value: initial() };
  const raw = useSyncExternalStore(storage.subscribe, () => storage.getItem(key), () => null);
  const value = useMemo(() => {
    if (raw === null) return fallback.current!.value;
    try { return decode(raw); } catch { return fallback.current!.value; }
  }, [raw, decode]);
  const setValue = useCallback((next: SetStateAction<T>) => {
    const currentRaw = storage.getItem(key);
    let current = fallback.current!.value;
    try { if (currentRaw !== null) current = decode(currentRaw); } catch { /* preserve fallback */ }
    const updated = typeof next === 'function' ? (next as (previous: T) => T)(current) : next;
    storage.setItem(key, JSON.stringify(updated));
  }, [storage, key, decode]);
  return [value, setValue] as const;
}
