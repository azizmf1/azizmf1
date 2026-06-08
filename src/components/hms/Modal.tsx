import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "warn" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

const TONE_RING: Record<string, string> = {
  default: "bg-[var(--brand-10)] text-[var(--brand-90)]",
  warn:    "bg-[var(--warn-50)] text-[var(--warn-700)]",
  danger:  "bg-[var(--err-50)] text-[var(--err-700)]",
  success: "bg-[var(--ok-50)] text-[var(--ok-700)]",
};

export function Modal({ open, onClose, title, description, children, footer, tone = "default", size = "md" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[var(--ink-100)]/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative w-full rounded-[var(--r-2xl)] bg-white shadow-[var(--shadow-lg)]",
        size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-lg",
      )}>
        <div className="flex items-start gap-3 p-5">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", TONE_RING[tone])}>
            <span className="size-2.5 rounded-full bg-current" />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-bold text-[var(--ink-90)]">{title}</h3>
            {description && <p className="mt-1 text-[14px] leading-6 text-[var(--ink-70)]">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--ink-60)] hover:bg-[var(--ink-10)]" aria-label="إغلاق">
            <X className="size-5" />
          </button>
        </div>
        {children && <div className="border-t border-[var(--ink-20)] px-5 py-4">{children}</div>}
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--ink-20)] bg-[var(--ink-10)] px-5 py-3 rounded-b-[var(--r-2xl)]">{footer}</div>}
      </div>
    </div>
  );
}
