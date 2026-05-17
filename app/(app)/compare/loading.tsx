import { Leaf } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[var(--bg-base)] transition-colors duration-500 animate-in fade-in duration-700">
      <div className="absolute w-[300px] h-[300px] rounded-full bg-gt-orange-500/5 blur-[120px] pointer-events-none" />
      
      <div className="relative w-48 h-48 flex items-center justify-center pointer-events-none">
        <Leaf 
          className="w-10 h-10 text-gt-orange-500 fill-gt-orange-500/10 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.2)] absolute left-10 top-12"
          style={{
            animation: "smooth-float-orange 4.5s ease-in-out infinite",
          }}
        />

        <Leaf 
          className="w-10 h-10 text-text-primary fill-text-primary/10 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.15)] absolute right-10 bottom-12"
          style={{
            animation: "smooth-float-black 5s ease-in-out infinite",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2.5 text-center mt-4">
        <h2 className="text-sm font-black text-text-primary tracking-[0.3em] uppercase animate-[text-glow_2.5s_ease-in-out_infinite]">
          GreenTrack Compare
        </h2>
        <div className="h-[2px] w-20 bg-border-subtle rounded-full overflow-hidden relative">
          <div 
            className="h-full w-full animate-[progress-bar_2.5s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(to right, var(--text-primary), var(--brand-orange))",
            }}
          />
        </div>
        <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-80 mt-1">
          Syncing comparative carbon analytics...
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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
        @keyframes text-glow {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes progress-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
