type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const memoryStore = new Map<string, string>();

const getMemoryValue = (key: string) => {
  const value = memoryStore.get(key);
  return value === undefined ? null : value;
};

const canUseLocalStorage = () => {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const hasLocalStorage = canUseLocalStorage();

export const safeLocalStorage: StorageLike = {
  getItem: (key: string) => {
    if (!hasLocalStorage) return getMemoryValue(key);
    try {
      const value = window.localStorage.getItem(key);
      return value ?? getMemoryValue(key);
    } catch {
      return getMemoryValue(key);
    }
  },
  setItem: (key: string, value: string) => {
    if (!hasLocalStorage) {
      memoryStore.set(key, value);
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem: (key: string) => {
    if (!hasLocalStorage) {
      memoryStore.delete(key);
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors; still clean up memory fallback.
    }
    memoryStore.delete(key);
  }
};
