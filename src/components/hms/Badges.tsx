import { cn } from "@/lib/utils";
import { STATUSES, type ReportStatus } from "@/data/lookups";
import type { Result } from "@/data/reports";
import { Check, X, Clock } from "lucide-react";

const TONES: Record<string, string> = {
  neutral: "bg-[var(--ink-10)] text-[var(--ink-80)] border-[var(--ink-20)]",
  amber:   "bg-[var(--warn-50)] text-[var(--warn-700)] border-[var(--warn-100)]",
  green:   "bg-[var(--ok-50)] text-[var(--ok-700)] border-[var(--ok-100)]",
  orange:  "bg-[#FFE8D9] text-[#A24700] border-[#FFC09E]",
  gray:    "bg-[var(--ink-10)] text-[var(--ink-60)] border-[var(--ink-20)]",
  red:     "bg-[var(--err-50)] text-[var(--err-700)] border-[var(--err-100)]",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const s = STATUSES[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium", TONES[s.tone])}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {s.ar}
    </span>
  );
}

export function ResultBadge({ result, size = "md" }: { result: Result; size?: "sm" | "md" | "lg" }) {
  if (!result) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border bg-[var(--ink-10)] text-[var(--ink-60)] border-[var(--ink-20)]",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]")}>
        <Clock className="size-3" /> غير محدد
      </span>
    );
  }
  const fit = result === "fit";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border font-medium",
      fit ? "bg-[var(--ok-50)] text-[var(--ok-700)] border-[var(--ok-100)]"
          : "bg-[var(--err-50)] text-[var(--err-700)] border-[var(--err-100)]",
      size === "sm" ? "px-2 py-0.5 text-[11px]" : size === "lg" ? "px-3 py-1.5 text-[14px]" : "px-2.5 py-1 text-[12px]")}>
      {fit ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      {fit ? "لائق طبيًا" : "غير لائق"}
    </span>
  );
}
