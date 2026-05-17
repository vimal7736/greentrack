"use client";
import { Leaf, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "success" | "warning";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="w-full max-w-md rounded-[3.5rem] overflow-hidden animate-in zoom-in-95 duration-500"
        style={{
          background: "var(--neu-base)",
          boxShadow: "var(--shadow-inset)",
          border: "var(--card-border)"
        }}
      >
        <div className="p-8 lg:p-12 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 flex items-center justify-center"
                style={{
                  borderRadius: "18px",
                  background: "var(--neu-base)",
                  boxShadow: "var(--shadow-inset)"
                }}
              >
                <Leaf className="w-7 h-7 text-gt-green-500" />
              </div>
              <div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-gt-green-700 leading-none mb-1">GreenTrack AI</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">Security Protocol</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center transition-all active:scale-90 hover:opacity-70"
              style={{
                borderRadius: "14px",
                background: "var(--neu-base)",
                boxShadow: "var(--shadow-raised)"
              }}
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-3xl font-black tracking-tighter text-text-primary leading-[0.9]">{title}</h4>
            <p className="text-[15px] font-bold text-text-muted leading-relaxed opacity-80">
              {message}
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] text-text-muted transition-all active:scale-95"
              style={{
                background: "var(--neu-base)",
                boxShadow: "var(--shadow-raised)"
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] text-white transition-all active:scale-95"
              style={{
                background: variant === "danger"
                  ? "linear-gradient(145deg, #ef4444, #b91c1c)"
                  : "linear-gradient(145deg, #22c55e, #15803d)",
                boxShadow: variant === "danger"
                  ? "0 10px 25px rgba(185,28,28,0.4)"
                  : "0 10px 25px rgba(21,128,61,0.4)"
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
