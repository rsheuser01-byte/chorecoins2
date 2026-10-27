import type { StorageAdapter } from './accountStorage';
export interface ObservableStorage extends StorageAdapter {
  subscribe(listener: () => void): () => void;
  notify(): void;
  transaction(work: () => void): void;
}
export function observableStorage(adapter: StorageAdapter & { transaction?: (work: () => void) => void }): ObservableStorage {
  const listeners = new Set<() => void>();
  let batching = 0;
  const notify = () => { if (!batching) listeners.forEach(listener => listener()); };
  return {
    getItem: key => adapter.getItem(key),
    setItem(key, value) {
      if (adapter.getItem(key) === value) return;
      adapter.setItem(key, value); notify();
    },
    removeItem(key) {
      if (adapter.getItem(key) === null) return;
      adapter.removeItem(key); notify();
    },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    notify,
    transaction(work) {
      batching++;
      try { if (adapter.transaction) adapter.transaction(work); else work(); }
      finally { batching--; notify(); }
    },
  };
}
