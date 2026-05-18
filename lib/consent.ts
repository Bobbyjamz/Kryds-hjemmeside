"use client";

export type ConsentState = "accepted" | "declined" | null;

const KEY = "kryds-cookie-consent";
const EVENT = "kryds-consent-change";

export function getConsent(): ConsentState {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(KEY);
    if (val === "accepted" || val === "declined") return val;
    return null;
  } catch {
    return null;
  }
}

export function setConsent(state: "accepted" | "declined"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, state);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: state }));
  } catch {}
}

export function onConsentChange(cb: (state: ConsentState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb(getConsent());
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function hasAnalyticsConsent(): boolean {
  return getConsent() === "accepted";
}
