import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[var(--r-2xl)] border border-[var(--ink-20)] bg-white shadow-[var(--shadow-sm)]", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon }: { title: string; subtitle?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--ink-20)] px-5 py-4">
      <div className="flex items-start gap-3">
        {icon && <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--brand-10)] text-[var(--brand-90)]">{icon}</div>}
        <div>
          <h3 className="text-[16px] font-bold text-[var(--ink-90)]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-[var(--ink-60)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
