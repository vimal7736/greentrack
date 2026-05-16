"use client";
import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

type Variant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES: Record<Variant, { accent: string; bg: string; icon: string }> = {
  danger: {
    accent: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    icon: "rgba(239,68,68,0.15)",
  },
  warning: {
    accent: "var(--brand-orange)",
    bg: "rgba(249,115,22,0.08)",
    icon: "rgba(249,115,22,0.15)",
  },
  info: {
    accent: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    icon: "rgba(59,130,246,0.15)",
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const style = VARIANT_STYLES[variant];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="fixed inset-0 z-[999] m-0 p-0 w-full h-full max-w-none max-h-none border-none bg-transparent"
      style={{ background: "transparent" }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-3xl p-6 lg:p-8 animate-scale-in"
          style={{
            background: "var(--bg-surface)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), var(--shadow-inset)",
            border: "var(--card-border)",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-bg-inset"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: style.icon }}
            >
              <AlertTriangle className="w-7 h-7" style={{ color: style.accent }} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-2 mb-8">
            <h3
              className="text-lg font-black tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h3>
            <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-bg-inset disabled:opacity-40"
              style={{
                background: "var(--neu-base)",
                color: "var(--text-muted)",
                border: "var(--card-border)",
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{
                background: style.accent,
                color: "#fff",
                boxShadow: `0 4px 14px ${style.accent}40`,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing…
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
