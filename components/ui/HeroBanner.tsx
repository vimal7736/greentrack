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
    <div className="premium-card p-8 border-none bg-gradient-to-r from-gt-green-900 to-black text-white relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
         {bgIcon}
      </div>
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20">
            {icon}
          </div>
          <div>
            <p className="text-lg font-black tracking-tight flex items-center gap-2">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
                 {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex-1 text-right">
             {action}
          </div>
        )}
      </div>
    </div>
  );
}
