import type { ReactNode } from "react";

interface HeroBannerProps {
  icon: ReactNode;
  bgIcon: ReactNode;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}

export function HeroBanner({ icon, bgIcon, title, subtitle, action }: HeroBannerProps) {
  return (
    <div className="premium-card p-5 sm:p-8 border-none bg-gradient-to-r from-gt-green-900 to-black text-white relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
         {bgIcon}
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20 shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs font-bold text-white/50 tracking-widest mt-1">
                 {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="sm:flex-1 sm:text-right">
             {action}
          </div>
        )}
      </div>
    </div>
  );
}
