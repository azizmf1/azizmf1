import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  loading?: boolean;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:   "bg-[var(--brand-90)] text-white hover:bg-[var(--brand-80)] active:bg-[var(--brand-100)] disabled:bg-[var(--ink-30)] disabled:text-white",
  secondary: "bg-white text-[var(--brand-90)] border border-[var(--brand-90)] hover:bg-[var(--brand-10)] active:bg-[var(--brand-20)] disabled:border-[var(--ink-30)] disabled:text-[var(--ink-40)]",
  ghost:     "bg-transparent text-[var(--brand-90)] hover:bg-[var(--brand-10)] active:bg-[var(--brand-20)]",
  danger:    "bg-[var(--err-600)] text-white hover:bg-[var(--err-700)]",
  success:   "bg-[var(--ok-600)] text-white hover:bg-[var(--ok-700)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  loading,
  block,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 select-none",
        "rounded-[var(--r-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-60)] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        block && "w-full",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon}
      {children}
      {iconEnd}
    </button>
  );
}
