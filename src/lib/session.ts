import type { User } from "@/data/users";

const KEY = "hms_session";

export interface Session {
  user: User;
  loginAt: string; // ISO
}

function isBrowser() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getSession(): Session | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(user: User): Session {
  const session: Session = { user, loginAt: new Date().toISOString() };
  if (isBrowser()) window.localStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

export function clearSession(): void {
  if (isBrowser()) window.localStorage.removeItem(KEY);
}

export function isAuthed(): boolean {
  return getSession() !== null;
}
