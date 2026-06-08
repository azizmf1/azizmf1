import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "warn" | "error" | "info";
interface Toast { id: number; tone: ToastTone; title: string; description?: string }

let _id = 1;
let _toasts: Toast[] = [];
const _listeners = new Set<(t: Toast[]) => void>();
function emit() { _listeners.forEach(l => l([..._toasts])); }
function push(t: Omit<Toast, "id">) {
  const id = _id++;
  _toasts = [..._toasts, { ...t, id }];
  emit();
  setTimeout(() => { _toasts = _toasts.filter(x => x.id !== id); emit(); }, 4500);
}
function remove(id: number) { _toasts = _toasts.filter(x => x.id !== id); emit(); }

export const toast = {
  success: (title: string, description?: string) => push({ tone: "success", title, description }),
  warn:    (title: string, description?: string) => push({ tone: "warn",    title, description }),
  error:   (title: string, description?: string) => push({ tone: "error",   title, description }),
  info:    (title: string, description?: string) => push({ tone: "info",    title, description }),
};

const TONE_STYLES: Record<ToastTone, string> = {
  success: "bg-white border-r-4 border-r-[var(--ok-600)]",
  warn:    "bg-white border-r-4 border-r-[var(--warn-600)]",
  error:   "bg-white border-r-4 border-r-[var(--err-600)]",
  info:    "bg-white border-r-4 border-r-[var(--brand-60)]",
};

const TONE_ICONS: Record<ToastTone, ReactElement> = {
  success: <CheckCircle2 className="size-5 text-[var(--ok-600)]" />,
  warn:    <AlertTriangle className="size-5 text-[var(--warn-600)]" />,
  error:   <XCircle className="size-5 text-[var(--err-600)]" />,
  info:    <Info className="size-5 text-[var(--brand-60)]" />,
};

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    _listeners.add(setItems);
    setItems([..._toasts]);
    return () => { _listeners.delete(setItems); };
  }, []);
  return (
    <div className="fixed top-4 left-4 z-[60] flex w-[min(360px,90vw)] flex-col gap-2 no-print">
      {items.map((t) => (
        <div key={t.id} className={cn("flex items-start gap-3 rounded-[var(--r-md)] p-3 shadow-[var(--shadow-md)] border border-[var(--ink-20)]", TONE_STYLES[t.tone])}>
          {TONE_ICONS[t.tone]}
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-[var(--ink-90)]">{t.title}</div>
            {t.description && <div className="text-[13px] text-[var(--ink-70)] mt-0.5">{t.description}</div>}
          </div>
          <button onClick={() => remove(t.id)} className="text-[var(--ink-50)] hover:text-[var(--ink-80)]"><X className="size-4" /></button>
        </div>
      ))}
    </div>
  );
}
