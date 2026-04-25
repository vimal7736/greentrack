import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?:  ReactNode;
  label?: string;
  error?: string;
}

export function Input({ icon, label, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[10px] font-black uppercase tracking-widest text-text-muted"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-gt-green-500 transition-colors pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          className={[
            "w-full bg-bg-inset/50 border-2 border-transparent rounded-2xl",
            "py-3.5 text-sm font-black",
            "focus:border-gt-green-500 focus:bg-white transition-all outline-none",
            icon ? "pl-11 pr-4" : "px-4",
            error ? "border-brand-orange-dark" : "",
            className,
          ].join(" ")}
          style={{ color: "var(--text-primary)" }}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-brand-orange-dark uppercase tracking-wider">{error}</p>
      )}
    </div>
  );
}
