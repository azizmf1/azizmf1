import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, required, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-[13px] font-medium text-[var(--ink-80)]">
        {label}
        {required && <span className="text-[var(--err-600)] me-1">*</span>}
      </label>
      {children}
      {error && <span className="text-[12px] text-[var(--err-600)]">{error}</span>}
      {!error && hint && <span className="text-[12px] text-[var(--ink-60)]">{hint}</span>}
    </div>
  );
}

const inputBase =
  "h-10 w-full rounded-[var(--r-md)] border border-[var(--ink-20)] bg-white px-3 text-[14px] text-[var(--ink-90)] " +
  "placeholder:text-[var(--ink-50)] outline-none transition-colors " +
  "focus:border-[var(--brand-60)] focus:ring-2 focus:ring-[var(--brand-60)]/20 " +
  "disabled:bg-[var(--ink-10)] disabled:text-[var(--ink-50)] disabled:cursor-not-allowed";

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  invalid?: boolean;
  ltr?: boolean;
  addonStart?: ReactNode;
}

export function TextInput({ invalid, ltr, addonStart, className, ...rest }: TextInputProps) {
  if (addonStart) {
    return (
      <div className={cn("flex h-10 w-full overflow-hidden rounded-[var(--r-md)] border border-[var(--ink-20)] bg-white focus-within:border-[var(--brand-60)] focus-within:ring-2 focus-within:ring-[var(--brand-60)]/20",
        invalid && "border-[var(--err-600)]")}>
        <div className="flex items-center bg-[var(--ink-10)] px-3 text-[13px] text-[var(--ink-70)] num">{addonStart}</div>
        <input
          {...rest}
          dir={ltr ? "ltr" : undefined}
          className={cn("flex-1 bg-white px-3 text-[14px] outline-none placeholder:text-[var(--ink-50)]", ltr && "num text-left", className)}
        />
      </div>
    );
  }
  return (
    <input
      {...rest}
      dir={ltr ? "ltr" : undefined}
      className={cn(inputBase, ltr && "num text-left", invalid && "border-[var(--err-600)] focus:border-[var(--err-600)] focus:ring-[var(--err-600)]/20", className)}
    />
  );
}


interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ invalid, options, placeholder, className, ...rest }: SelectProps) {
  return (
    <select
      {...rest}
      className={cn(inputBase, "appearance-none bg-[length:16px] bg-[left_12px_center] bg-no-repeat pl-9",
        invalid && "border-[var(--err-600)] focus:border-[var(--err-600)] focus:ring-[var(--err-600)]/20", className)}
      style={{
        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23697077' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
      }}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function TextArea({ invalid, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...rest}
      className={cn(inputBase, "h-auto py-2 resize-none", invalid && "border-[var(--err-600)] focus:border-[var(--err-600)] focus:ring-[var(--err-600)]/20", className)}
    />
  );
}
