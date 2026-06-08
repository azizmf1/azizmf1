import { cn } from "@/lib/utils";
import { BLOOD_TYPES } from "@/data/lookups";

export function BloodChips({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {BLOOD_TYPES.map(t => (
        <button
          key={t}
          type="button"
          disabled={disabled}
          onClick={() => onChange(t)}
          className={cn(
            "num min-w-[56px] rounded-[var(--r-md)] border px-3 py-2 text-[14px] font-semibold transition-colors",
            value === t
              ? "border-[var(--brand-90)] bg-[var(--brand-90)] text-white"
              : "border-[var(--ink-20)] bg-white text-[var(--ink-80)] hover:border-[var(--brand-60)] hover:bg-[var(--brand-10)]",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
