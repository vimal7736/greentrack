"use client";
import { Leaf } from "lucide-react";

/**
 * PageLoader
 * A premium, full-screen loading state used across the application.
 * Resolves the previous missing "LoadingScreen" module error.
 */
export default function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-base)] transition-colors duration-500">
      <div className="relative">
        {/* Premium Spinner: Outer spinning ring with brand colors */}
        <div className="w-20 h-20 border-[3px] border-gt-green-500/10 border-t-gt-green-600 rounded-full animate-spin" />
        
        {/* Inner spinning ring (counter-clockwise) for complexity */}
        <div className="absolute inset-2 border-[3px] border-gt-orange-500/10 border-b-gt-orange-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
        
        {/* Central Brand Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Leaf className="w-7 h-7 text-gt-green-600 drop-shadow-sm" />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black text-text-primary tracking-[0.3em] uppercase animate-pulse">
            GreenTrack AI
          </h2>
          <div className="h-1 w-12 bg-gt-green-500/30 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-gt-green-500 w-full animate-[loading_2s_ease-in-out_infinite]" />
          </div>
        </div>
        <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-80">
          Syncing environmental metrics...
        </p>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
