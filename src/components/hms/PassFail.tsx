import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface Props {
  value: "passed" | "failed";
  onChange: (v: "passed" | "failed") => void;
  name?: string;
  passedLabel?: string;
  failedLabel?: string;
  disabled?: boolean;
}

export function PassFailToggle({ value, onChange, passedLabel = "سليم", failedLabel = "غير سليم", disabled }: Props) {
  return (
    <div className="inline-flex w-full overflow-hidden rounded-[var(--r-md)] border border-[var(--ink-20)] bg-white">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("passed")}
        className={cn(
          "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors",
          value === "passed" ? "bg-[var(--ok-50)] text-[var(--ok-700)]" : "text-[var(--ink-70)] hover:bg-[var(--ink-10)]",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <Check className="size-3.5" /> {passedLabel}
      </button>
      <div className="w-px bg-[var(--ink-20)]" />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("failed")}
        className={cn(
          "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors",
          value === "failed" ? "bg-[var(--err-50)] text-[var(--err-700)]" : "text-[var(--ink-70)] hover:bg-[var(--ink-10)]",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <X className="size-3.5" /> {failedLabel}
      </button>
    </div>
  );
}
