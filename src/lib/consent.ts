import { useSyncExternalStore } from "react";

/**
 * Analytics-cookie consent, persisted in localStorage. GA is gated on "granted"
 * (UK/EU PECR); PostHog + Vercel Analytics run regardless (privacy-first configs).
 */
export type Consent = "granted" | "denied";

const KEY = "haypile-analytics-consent";
const listeners = new Set<() => void>();

function read(): Consent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function setConsent(value: Consent): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, value);
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

/** Reactive consent value. `null` until the user chooses (and during SSR). */
export function useConsent(): Consent | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
