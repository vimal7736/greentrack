"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastCtx {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

/* ── Config ────────────────────────────────────────────────── */
const ICON_MAP: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const COLOR_MAP: Record<ToastVariant, { accent: string; bg: string; border: string }> = {
  success: {
    accent: "var(--brand-green)",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.20)",
  },
  error: {
    accent: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.20)",
  },
  warning: {
    accent: "var(--brand-orange)",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.20)",
  },
  info: {
    accent: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.20)",
  },
};

const DURATION = 4000;

/* ── Context ───────────────────────────────────────────────── */
const ToastContext = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ── Provider ──────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctx: ToastCtx = {
    success: (msg) => push("success", msg),
    error: (msg) => push("error", msg),
    warning: (msg) => push("warning", msg),
    info: (msg) => push("info", msg),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => {
          const color = COLOR_MAP[t.variant];
          const Icon = ICON_MAP[t.variant];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl animate-slide-up"
              style={{
                background: "var(--bg-surface)",
                border: `1px solid ${color.border}`,
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), var(--shadow-raised)",
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: color.bg }}
              >
                <Icon className="w-4 h-4" style={{ color: color.accent }} />
              </div>
              <p
                className="flex-1 text-xs font-bold leading-snug"
                style={{ color: "var(--text-primary)" }}
              >
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all hover:bg-bg-inset"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
