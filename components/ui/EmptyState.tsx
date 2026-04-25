import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon:        ReactNode;
  title:       string;
  description: string;
  ctaLabel?:   string;
  ctaHref?:    string;
}

export function EmptyState({ icon, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto py-32 text-center animate-scale-in">
      <div className="relative">
        <div className="w-24 h-24 rounded-[2.5rem] bg-bg-inset/50 flex items-center justify-center text-text-muted/20 rotate-12">
          {icon}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-black tracking-tight text-text-primary">{title}</h3>
        <p className="text-sm font-bold text-text-muted leading-relaxed">{description}</p>
      </div>

      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="group relative px-8 py-4 rounded-[1.5rem] bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-gt-green-600 hover:shadow-xl hover:shadow-gt-green-500/20 active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gt-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10 flex items-center gap-2">
            {ctaLabel} <ArrowUpRight className="w-4 h-4" />
          </span>
        </Link>
      )}
    </div>
  );
}
