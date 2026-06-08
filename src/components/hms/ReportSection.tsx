import type { ReactNode } from "react";

type ReportSectionProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ReportSection({ title, subtitle, icon, children, className = "" }: ReportSectionProps) {
  return (
    <section
      className={`overflow-hidden rounded-[var(--r-lg)] border border-[var(--ink-20)] bg-white shadow-[var(--shadow-sm)] ${className}`.trim()}
    >
      <div className="border-b border-[var(--ink-20)] px-5 py-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="mt-0.5 flex size-8 items-center justify-center rounded-[var(--r-md)] bg-[var(--ink-10)] text-[var(--brand-80)]">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-[var(--ink-95)]">{title}</h3>
            {subtitle ? <p className="mt-1 text-[12px] text-[var(--ink-60)]">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export default ReportSection;