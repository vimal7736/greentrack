"use client";
import { Leaf } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-base)] transition-colors duration-500">
      <div className="relative w-48 h-48 flex items-center justify-center pointer-events-none">
        <Leaf 
          className="w-10 h-10 text-gt-green-500 fill-gt-green-500/10 filter drop-shadow-[0_0_10px_rgba(34,197,94,0.2)] absolute left-6 bottom-8"
          style={{
            animation: "smooth-float-green 4s ease-in-out infinite",
          }}
        />

        <Leaf 
          className="w-10 h-10 text-gt-orange-500 fill-gt-orange-500/10 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.2)] absolute top-6 left-16"
          style={{
            animation: "smooth-float-orange 4.5s ease-in-out infinite",
          }}
        />

        <Leaf 
          className="w-10 h-10 text-text-primary fill-text-primary/10 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.15)] absolute right-6 bottom-8"
          style={{
            animation: "smooth-float-black 5s ease-in-out infinite",
          }}
        />
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black text-text-primary tracking-[0.3em] uppercase animate-pulse">
            GreenTrack AI
          </h2>
          <div className="h-[2px] w-20 bg-border-subtle rounded-full mt-2 overflow-hidden relative">
            <div 
              className="h-full w-full animate-[loading_2s_ease-in-out_infinite]"
              style={{
                background: "linear-gradient(to right, var(--brand-green), var(--brand-orange))",
              }}
            />
          </div>
        </div>
        <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-80 mt-1">
          Syncing environmental metrics...
        </p>
      </div>

      <style jsx>{`
        @keyframes smooth-float-green {
          0%, 100% {
            transform: translateY(0px) rotate(-15deg);
          }
          50% {
            transform: translateY(-12px) rotate(-5deg);
          }
        }
        @keyframes smooth-float-orange {
          0%, 100% {
            transform: translateY(0px) rotate(10deg);
          }
          50% {
            transform: translateY(-15px) rotate(20deg);
          }
        }
        @keyframes smooth-float-black {
          0%, 100% {
            transform: translateY(0px) rotate(25deg);
          }
          50% {
            transform: translateY(-10px) rotate(15deg);
          }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
