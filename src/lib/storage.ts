
'use client';

/**
 * Saves a value to localStorage.
 * @param key The key to save the value under.
 * @param value The value to save (will be JSON.stringified).
 */
export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const serializedState = JSON.stringify(value);
    window.localStorage.setItem(key, serializedState);
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

/**
 * Loads a value from localStorage.
 * @param key The key to load the value from.
 * @returns The parsed value, or null if not found or on error.
 */
export function loadFromLocalStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const serializedState = window.localStorage.getItem(key);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.error("Failed to load from localStorage", e);
    return null;
  }
}
