"use client";
import { X, ExternalLink, FileText, Leaf } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface BillViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  billDate?: string;
  supplier?: string;
}

export function BillViewModal({ isOpen, onClose, pdfUrl, billDate, supplier }: BillViewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setLoading(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen || !pdfUrl) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="w-full max-w-6xl h-full lg:h-[92vh] rounded-[3rem] lg:rounded-[4rem] overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl border border-white/10 flex flex-col"
        style={{
          background: "var(--neu-base)",
          boxShadow: "var(--shadow-inset)"
        }}
      >
        {/* Header */}
        <div className="px-6 lg:px-10 py-6 lg:py-8 flex items-center justify-between border-b border-black/5 bg-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-gt-green-600 shadow-sm"
              style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}
            >
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-black uppercase tracking-tight text-text-primary leading-tight">
                {supplier ?? "Utility Document"}
              </h3>
              <p className="text-[10px] lg:text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] opacity-60">
                Audit Date: {billDate ?? "Unknown"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-text-muted hover:text-gt-green-600 transition-all active:scale-90 shadow-sm"
              style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)" }}
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-text-muted hover:text-red-500 transition-all active:scale-90 shadow-sm"
              style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)" }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-zinc-200/40 p-4 lg:p-10 relative">
          <div className="w-full h-full rounded-[2rem] overflow-hidden  shadow-2xl border border-black/5 relative">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 animate-in fade-in duration-300">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)" }}
                >
                  <Leaf className="w-10 h-10 text-gt-green-500 animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gt-green-700 animate-pulse">
                  Decrypting Audit Record...
                </p>
              </div>
            )}

            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
              className={`w-full h-full border-none transition-opacity duration-700 bg-white ${loading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setLoading(false)}
              title="Bill Document Preview"
            />

            {/* Subtle Overlay to match theme */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-[2rem]" />
          </div>
        </div>

        {/* Footer Area */}
        <div className="px-10 py-6 flex items-center justify-between border-t border-black/5 bg-white/20">
          <div className="hidden lg:block">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em] opacity-30 italic">
              Secured Audit Trail • GreenTrack Enterprise
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full lg:w-auto px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-text-muted transition-all active:scale-95 shadow-sm"
            style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)" }}
          >
            Dismiss Preview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
