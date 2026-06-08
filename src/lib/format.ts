import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "yyyy/MM/dd", { locale: ar });
  } catch {
    return "—";
  }
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "yyyy/MM/dd · HH:mm", { locale: ar });
  } catch {
    return "—";
  }
}

export function age(dob?: string): string {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return `${years} سنة`;
}
