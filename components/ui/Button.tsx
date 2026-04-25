import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   "bg-black text-white hover:bg-gt-green-600 hover:shadow-lg hover:shadow-gt-green-500/20",
  secondary: "bg-white text-text-primary hover:bg-black hover:text-white shadow-sm",
  ghost:     "bg-transparent text-text-muted hover:text-text-primary hover:bg-white",
  danger:    "bg-white text-text-muted hover:bg-brand-orange-dark hover:text-white shadow-sm",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[9px] rounded-xl",
  md: "px-4 py-2.5 text-[10px] rounded-xl",
  lg: "px-8 py-4 text-[11px] rounded-2xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  icon?:     ReactNode;
  children:  ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant  = "secondary",
  size     = "md",
  icon,
  children,
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2",
        "font-black uppercase tracking-widest",
        "border-none transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
