import { useSyncExternalStore } from 'react';
import { z } from 'zod';

/**
 * Versioned localStorage repositories. All keys live under `rr.v1.`.
 * Writes are guarded (private-mode / quota failures return false instead of
 * throwing); reads fall back to the initial value on missing/corrupt data.
 */

const NAMESPACE = 'rr.v1.';
export const STORAGE_VERSION = 1;

export function namespaced(key: string): string {
  return `${NAMESPACE}${key}`;
}

export interface Store<T> {
  get: () => T;
  set: (value: T) => boolean;
  update: (fn: (prev: T) => T) => boolean;
  reset: () => void;
  subscribe: (listener: () => void) => () => void;
  useValue: () => T;
}

export function createStore<T>(key: string, schema: z.ZodType<T>, initial: T): Store<T> {
  const fullKey = namespaced(key);
  const listeners = new Set<() => void>();
  let cache: T | undefined;

  function read(): T {
    if (cache !== undefined) return cache;
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (raw == null) {
        cache = initial;
        return cache;
      }
      const parsed: unknown = JSON.parse(raw);
      const result = schema.safeParse(parsed);
      cache = result.success ? result.data : initial;
      return cache;
    } catch {
      cache = initial;
      return cache;
    }
  }

  function emit(): void {
    for (const listener of listeners) listener();
  }

  function write(value: T): boolean {
    cache = value;
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(value));
    } catch {
      emit();
      return false;
    }
    emit();
    return true;
  }

  // Cross-tab sync.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === fullKey) {
        cache = undefined;
        emit();
      }
    });
  }

  return {
    get: read,
    set: write,
    update: (fn: (prev: T) => T) => write(fn(read())),
    reset: () => {
      cache = initial;
      try {
        window.localStorage.removeItem(fullKey);
      } catch {
        /* ignore */
      }
      emit();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    useValue: () => useSyncExternalStore(
      (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      read,
      read,
    ),
  };
}
