import type { StorageAdapter } from './accountStorage';
export interface ObservableStorage extends StorageAdapter {
  subscribe(listener: () => void): () => void;
  notify(): void;
}
export function observableStorage(adapter: StorageAdapter): ObservableStorage {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
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
  };
}
