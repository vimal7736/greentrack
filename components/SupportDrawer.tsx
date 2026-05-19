"use client";
import { useState, useRef, useEffect } from "react";
import {
  X, Send, CheckCircle, LifeBuoy, AlertCircle, ChevronRight,
  ChevronDown, CreditCard, FileText, Users, Plug, ShieldCheck,
  Bug, MessageSquare, Upload, BarChart2, Lock, Check,
} from "lucide-react";

const OWNER_TOPICS = [
  { label: "Billing & Subscription",  icon: CreditCard  },
  { label: "SECR Compliance Help",    icon: FileText    },
  { label: "Team Management",         icon: Users       },
  { label: "API / Integrations",      icon: Plug        },
  { label: "Account & Data (GDPR)",   icon: ShieldCheck },
  { label: "Bug Report",              icon: Bug         },
  { label: "General Feedback",        icon: MessageSquare },
];

const MEMBER_TOPICS = [
  { label: "Bill Upload Issue",           icon: Upload      },
  { label: "Dashboard / Data Question",   icon: BarChart2   },
  { label: "Report Generation",           icon: FileText    },
  { label: "Access Problem",              icon: Lock        },
  { label: "Bug Report",                  icon: Bug         },
  { label: "General Feedback",            icon: MessageSquare },
];

interface SupportDrawerProps {
  open:      boolean;
  onClose:   () => void;
  userRole:  string;
  userName:  string;
  userEmail: string;
  orgName:   string;
  orgTier:   string;
}

function TopicDropdown({
  topics,
  value,
  onChange,
}: {
  topics: { label: string; icon: React.ElementType }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const selected = topics.find(t => t.label === value);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all"
        style={{
          background: "var(--bg-inset)",
          border: open
            ? "1px solid rgba(34,197,94,0.55)"
            : "1px solid var(--border-default)",
          color: selected ? "var(--text-primary)" : "var(--text-muted)",
          cursor: "pointer",
          boxShadow: open ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
          transition: "border-color 0.18s, box-shadow 0.18s",
        }}
      >
        {selected ? (
          <selected.icon className="w-4 h-4 shrink-0" style={{ color: "#4ade80" }} />
        ) : (
          <div className="w-4 h-4 shrink-0 rounded-sm" style={{ background: "var(--border-default)" }} />
        )}
        <span className="flex-1 text-left text-sm font-medium">
          {selected ? selected.label : "Select a topic…"}
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform duration-200"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown list */}
      <div
        className="absolute left-0 right-0 z-10 mt-1.5 rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2)",
          transformOrigin: "top center",
          transform: open ? "scaleY(1) translateY(0)" : "scaleY(0.92) translateY(-6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease",
        }}
      >
        <div className="py-1.5">
          {topics.map(({ label, icon: Icon }) => {
            const isSelected = value === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => { onChange(label); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-sm transition-colors"
                style={{
                  background: isSelected ? "rgba(34,197,94,0.10)" : "transparent",
                  color: isSelected ? "#4ade80" : "var(--text-secondary)",
                  cursor: "pointer",
                  border: "none",
                  textAlign: "left",
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--bg-inset)";
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: isSelected ? "#4ade80" : "var(--text-muted)" }}
                />
                <span className="flex-1 font-medium">{label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#4ade80" }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SupportDrawer({
  open, onClose, userRole, userName, userEmail, orgName, orgTier,
}: SupportDrawerProps) {
  const [topic,     setTopic]     = useState("");
  const [message,   setMessage]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const isOwner = userRole === "owner" || userRole === "admin";
  const topics  = isOwner ? OWNER_TOPICS : MEMBER_TOPICS;

  const initials = (userName || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const tierColors: Record<string, React.CSSProperties> = {
    free: {
      background: "var(--neu-base)",
      boxShadow:  "inset 2px 2px 5px var(--neu-dark), inset -2px -2px 5px var(--neu-light)",
      color:      "var(--text-muted)",
      border:     "var(--card-border)",
    },
    starter: {
      background: "var(--neu-base)",
      boxShadow:  "inset 2px 2px 5px var(--neu-inset-orange-dark), inset -2px -2px 5px var(--neu-inset-orange-light)",
      color:      "var(--brand-orange-dark)",
      border:     "1px solid rgba(249,115,22,0.18)",
    },
    business: {
      background: "var(--neu-base)",
      boxShadow:  "inset 2px 2px 5px var(--neu-inset-green-dark), inset -2px -2px 5px var(--neu-inset-green-light)",
      color:      "var(--brand-green-dark)",
      border:     "1px solid rgba(34,197,94,0.22)",
    },
  };
  const tierStyle = tierColors[orgTier] ?? tierColors.free;

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!topic) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, message }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
    } catch {
      setError("Could not send. Please email support@greentrack.ai directly.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setTopic("");
      setMessage("");
      setError(null);
    }, 320);
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* ── Drawer panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Help & Support"
        className="fixed top-0 right-0 bottom-0 z-[65] w-full sm:w-[22rem] flex flex-col"
        style={{
          background: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border-default)",
          boxShadow: "-24px 0 80px rgba(0,0,0,0.45)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.22)",
              }}
            >
              <LifeBuoy className="w-4 h-4 text-gt-green-500" />
            </div>
            <div>
              <p className="text-sm font-black leading-tight" style={{ color: "var(--text-primary)" }}>
                Help &amp; Support
              </p>
              <p className="text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>
                Reply within one business day
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close support panel"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-inset)]"
            style={{ color: "var(--text-muted)", border: "none", cursor: "pointer", background: "transparent" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── User context strip ── */}
        <div
          className="px-5 py-3 shrink-0 flex items-center gap-3"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
            style={{ background: "linear-gradient(145deg,#16a34a,#22c55e)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate leading-tight" style={{ color: "var(--text-primary)" }}>
              {orgName}
            </p>
            <p className="text-[10px] truncate leading-tight" style={{ color: "var(--text-muted)" }}>
              {userEmail}
            </p>
          </div>
          <span
            className="shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
            style={tierStyle}
          >
            {orgTier}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
              >
                <CheckCircle className="w-7 h-7 text-gt-green-500" />
              </div>
              <div>
                <p className="text-sm font-black mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Message Sent
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  We&apos;ll reply to{" "}
                  <span className="font-bold text-gt-green-600">{userEmail}</span>{" "}
                  within one business day.
                </p>
              </div>
              <button
                onClick={() => { setSubmitted(false); setTopic(""); setMessage(""); }}
                className="text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all hover:scale-[1.03]"
                style={{
                  background: "var(--bg-inset)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                  cursor: "pointer",
                }}
              >
                Send Another
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
              <div className="mb-1">
                <p className="text-xs font-black leading-tight" style={{ color: "var(--text-primary)" }}>
                  What do you need help with?
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Your account details attach automatically.
                </p>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
                  style={{
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    color: "#ef4444",
                  }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                  {error}
                </div>
              )}

              {/* Topic — custom dropdown */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[9px] font-black uppercase tracking-[0.2em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Topic *
                </label>
                <TopicDropdown topics={topics} value={topic} onChange={setTopic} />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  className="text-[9px] font-black uppercase tracking-[0.2em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Message *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Describe what you need help with…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none transition-all focus:outline-none"
                  style={{
                    background: "var(--bg-inset)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                    minHeight: 130,
                    flex: 1,
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.08)"; }}
                  onBlur={e  => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !topic}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                style={{
                  background: "linear-gradient(135deg,#22c55e 0%,#15803d 100%)",
                  boxShadow: "0 0 22px rgba(34,197,94,0.18)",
                  cursor: loading || !topic ? "not-allowed" : "pointer",
                  border: "none",
                }}
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Message
                  </>
                )}
              </button>

              <p
                className="text-[9px] font-medium text-center pb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Mon–Fri · 9am–6pm UK · support@greentrack.ai
              </p>
            </form>
          )}
        </div>

        {/* ── Quick links footer ── */}
        {!submitted && (
          <div
            className="shrink-0 px-5 py-4"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2.5" style={{ color: "var(--text-muted)" }}>
              Quick Links
            </p>
            <div className="flex flex-col gap-1">
              {[
                { label: "SECR Reporting Guide",  href: "https://www.gov.uk/government/publications/streamlined-energy-and-carbon-reporting-secr-regulations-evaluation" },
                { label: "DEFRA Emission Factors", href: "https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs" },
                { label: "Privacy & GDPR",         href: "/privacy" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-inset)]"
                  style={{ color: "var(--text-secondary)", textDecoration: "none" }}
                >
                  <ChevronRight className="w-3 h-3 shrink-0 text-gt-green-600" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
