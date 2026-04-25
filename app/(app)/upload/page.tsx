"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { 
  Upload, CheckCircle, AlertCircle, Edit3, Zap, Flame, 
  Droplets, Fuel, ArrowUpRight, Leaf 
} from "lucide-react";

type BillTypeKey = "electricity" | "gas" | "water" | "fuel_diesel" | "fuel_petrol";
type Stage = "upload" | "processing" | "review" | "result";

interface OcrResult {
  supplier: string | null;
  bill_period: string | null;
  usage: number | null;
  unit: string;
  amount_due: number | null;
  account_number: string | null;
}

interface SaveResult {
  co2_kg: number;
  factor_used: number;
  scope: string;
  equivalents: { miles_driven: number; trees_one_year: number };
}

const BILL_TYPES: { key: BillTypeKey; label: string; sub?: string; icon: React.ReactNode }[] = [
  { key: "electricity", label: "Electricity", icon: <Zap className="w-4 h-4" /> },
  { key: "gas", label: "Gas", icon: <Flame className="w-4 h-4" /> },
  { key: "water", label: "Water", icon: <Droplets className="w-4 h-4" /> },
  { key: "fuel_diesel", label: "Fuel", sub: "Diesel", icon: <Fuel className="w-4 h-4" /> },
  { key: "fuel_petrol", label: "Fuel", sub: "Petrol", icon: <Fuel className="w-4 h-4" /> },
];

export default function UploadPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [billType, setBillType] = useState<BillTypeKey>("electricity");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Upload step state
  const [storagePath, setStoragePath] = useState("");

  // OCR step state
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [usage, setUsage] = useState<string>("");
  const [unit, setUnit] = useState<string>("kWh");
  const [billDate, setBillDate] = useState<string>("");
  const [costGbp, setCostGbp] = useState<string>("");

  // Save result
  const [result, setResult] = useState<SaveResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 1: Upload PDF ────────────────────────────────────────────────────
  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    setStage("processing");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bill_type", billType);

    const uploadRes = await fetch("/api/bills/upload", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      setError(uploadData.error ?? "Upload failed");
      setStage("upload");
      return;
    }

    setStoragePath(uploadData.storagePath);

    // ── Step 2: OCR ────────────────────────────────────────────────────────
    const ocrRes = await fetch("/api/bills/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedUrl: uploadData.signedUrl, billType }),
    });
    const ocrData = await ocrRes.json();

    if (ocrRes.ok) {
      setOcr(ocrData);
      setUsage(ocrData.usage != null ? String(ocrData.usage) : "");
      setUnit(ocrData.unit ?? "kWh");
      setCostGbp(ocrData.amount_due != null ? String(ocrData.amount_due) : "");
    } else {
      // OCR failed — still go to review with blank fields
      setOcr(null);
      setUsage("");
      setUnit(billType === "water" ? "m3" : billType.startsWith("fuel") ? "litre" : "kWh");
    }

    // Default bill date to today if not extracted
    setBillDate(new Date().toISOString().slice(0, 10));
    setStage("review");
  }

  // ── Step 3: Save Bill ─────────────────────────────────────────────────────
  async function handleSave() {
    setError(null);
    if (!usage || !billDate) {
      setError("Please enter usage and bill date.");
      return;
    }

    const res = await fetch("/api/bills/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bill_type: billType,
        bill_date: billDate,
        usage_amount: Number(usage),
        usage_unit: unit,
        supplier: ocr?.supplier ?? null,
        account_number: ocr?.account_number ?? null,
        cost_gbp: costGbp ? Number(costGbp) : null,
        pdf_url: storagePath,
        ocr_raw: ocr,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to save bill");
      return;
    }

    setResult(data);
    setStage("result");
  }

  function reset() {
    setStage("upload");
    setError(null);
    setFileName("");
    setOcr(null);
    setUsage("");
    setResult(null);
  }

  const stages: Stage[] = ["upload", "processing", "review", "result"];
  const currentIdx = stages.indexOf(stage);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-5 h-5" style={{ color: "var(--brand-green)" }} />
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Upload Bill
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Automatically extract data from your utility bills using AI
          </p>
        </div>

        <div
          className="neu-raised inline-flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ color: "var(--brand-green-dark)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gt-green-500 animate-pulse-green inline-block" />
          <span className="text-xs font-bold uppercase tracking-widest">2025 DEFRA Active</span>
        </div>
      </div>

      {/* ── Step Indicator ────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {["Upload", "Processing", "Review", "Result"].map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div
              key={s}
              className={`relative flex flex-col items-center gap-2 py-3 rounded-xl transition-all duration-300 ${
                active ? "neu-inset" : done ? "neu-raised opacity-70" : "neu-raised opacity-40"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                done ? "bg-gt-green-500 text-cream-50" : active ? "bg-gt-green-100 text-gt-green-700" : "bg-bg-inset text-text-muted"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-text-primary" : "text-text-muted"}`}>
                {s}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Stage: Upload */}
      {stage === "upload" && (
        <div className="space-y-8 animate-scale-in">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                1. Select Bill Type
              </label>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-bg-inset text-text-muted">
                Choose one to start
              </span>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {BILL_TYPES.map(({ key, label, sub, icon }) => {
                const active = billType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBillType(key)}
                    className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] transition-all duration-500 overflow-hidden ${
                      active 
                        ? "active-selection" 
                        : "premium-card hover:bg-white/40"
                    }`}
                  >
                    {/* Background Glow for active state */}
                    {active && (
                      <div className="absolute inset-0 bg-gradient-to-br from-gt-green-500/10 to-transparent opacity-50" />
                    )}
                    
                    <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      active 
                        ? "bg-gt-green-500 text-white shadow-lg shadow-gt-green-500/40 rotate-3" 
                        : "bg-bg-inset text-text-muted group-hover:scale-110 group-hover:bg-gt-green-100 group-hover:text-gt-green-600"
                    }`}>
                      {icon}
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                      <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${
                        active ? "text-gt-green-900" : "text-text-primary"
                      }`}>
                        {label}
                      </span>
                      {sub && (
                        <span className={`text-[9px] font-bold mt-0.5 opacity-60 ${
                          active ? "text-gt-green-700" : "text-text-muted"
                        }`}>
                          {sub}
                        </span>
                      )}
                    </div>

                    {/* Active Tick */}
                    {active && (
                      <div className="absolute top-3 right-3 w-4 h-4 bg-gt-green-500 rounded-full flex items-center justify-center animate-scale-in">
                        <CheckCircle className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
              2. Upload Document
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative overflow-hidden rounded-[2.5rem] p-16 text-center transition-all duration-700 cursor-pointer ${
                dragOver 
                  ? "active-selection scale-[0.99]" 
                  : "premium-card border-dashed border-2 hover:border-solid hover:bg-white/40"
              }`}
            >
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-20 h-20 rounded-3xl mb-6 flex items-center justify-center transition-all duration-700 ${
                  dragOver ? "bg-gt-green-500 text-white shadow-2xl" : "bg-bg-inset text-gt-green-500 shadow-inner group-hover:scale-110 group-hover:bg-gt-green-100"
                }`}>
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
                  Drop your PDF bill here
                </h3>
                <p className="text-xs font-bold max-w-[200px] mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Securely upload your energy or utility bill to extract CO₂ data automatically
                </p>
                <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-bg-inset/50 text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:bg-gt-green-500 group-hover:text-white transition-colors">
                  <span>Browse local files</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gt-green-500/5 rounded-full blur-3xl" />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-orange/5 rounded-full blur-3xl" />
            </div>
          </div>

          <div className="flex items-center justify-between p-6 rounded-3xl glass-green border-none shadow-sm">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-gt-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-gt-green-600" />
               </div>
               <div>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--brand-green-darker)" }}>
                    Enterprise Security
                  </p>
                  <p className="text-[10px] font-bold opacity-70" style={{ color: "var(--brand-green-darker)" }}>
                    Mindee AI OCR provides end-to-end encryption for your documents.
                  </p>
               </div>
            </div>
            <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-gt-green-700 hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      )}

      {/* Stage: Processing */}
      {stage === "processing" && (
        <div className="premium-card p-20 text-center space-y-8 animate-pulse border-none bg-white/40 backdrop-blur-xl">
          <div className="relative w-24 h-24 mx-auto">
             <div className="absolute inset-0 border-8 border-gt-green-500/10 rounded-[2rem]" />
             <div className="absolute inset-0 border-8 border-gt-green-500 border-t-transparent rounded-[2rem] animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-10 h-10 text-gt-green-500" />
             </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Analyzing Document
            </h2>
            <p className="text-sm font-bold opacity-60" style={{ color: "var(--text-muted)" }}>
              Extracting semantic data for {billType} emissions...
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-gt-green-100 text-gt-green-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" /> Secure Link Established
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] animate-bounce" style={{ color: "var(--text-muted)" }}>
              Scanning JSON Payload...
            </div>
          </div>
        </div>
      )}

      {/* Stage: Review */}
      {stage === "review" && (
        <div className="space-y-6 animate-scale-in">
          <div className="premium-card p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gt-green-500 text-white flex items-center justify-center shadow-lg shadow-gt-green-500/30">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                    {ocr ? "Extraction Complete" : "Manual Entry"}
                  </h2>
                  <p className="text-xs font-bold opacity-60" style={{ color: "var(--text-muted)" }}>
                    Verify the details below before saving
                  </p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-bg-inset text-[10px] font-black uppercase tracking-widest text-text-muted">
                Audit Mode
              </div>
            </div>

            {ocr && (
              <div className="grid grid-cols-4 gap-4 p-6 rounded-3xl bg-bg-inset/30 border border-border-subtle shadow-inner">
                {[
                  { label: "Supplier", value: ocr.supplier },
                  { label: "Period", value: ocr.bill_period },
                  { label: "Account", value: ocr.account_number },
                  { label: "Cost", value: ocr.amount_due != null ? `£${Number(ocr.amount_due).toFixed(2)}` : null },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1 opacity-60">
                      {item.label}
                    </span>
                    <span className="text-xs font-black text-text-primary truncate">
                      {item.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: "var(--text-muted)" }}>
                  Bill Date *
                </label>
                <div className="relative group">
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full bg-bg-inset/50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-black focus:border-gt-green-500 focus:bg-white transition-all outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: "var(--text-muted)" }}>
                  Total Cost (£)
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={costGbp}
                    onChange={(e) => setCostGbp(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-bg-inset/50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-black focus:border-gt-green-500 focus:bg-white transition-all outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black opacity-30">GBP</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: "var(--text-muted)" }}>
                Energy Usage ({unit}) *
              </label>
              <div className="relative group">
                <input
                  type="number"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  placeholder="0"
                  className="w-full bg-bg-inset/50 border-2 border-transparent rounded-[2rem] px-8 py-6 text-3xl font-black focus:border-gt-green-500 focus:bg-white transition-all outline-none pr-24"
                  style={{ color: "var(--text-primary)" }}
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                   <span className="text-sm font-black uppercase tracking-widest opacity-30">{unit}</span>
                   <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-border-subtle group-hover:scale-110 transition-transform">
                      <Edit3 className="w-5 h-5 text-text-muted" />
                   </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-gradient-to-r from-gt-green-500/10 to-transparent border border-gt-green-500/20 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gt-green-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-gt-green-500/20">
                <Leaf className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold leading-relaxed" style={{ color: "var(--text-primary)" }}>
                Applied 2025 DEFRA standard: <span className="text-gt-green-700 font-black">Scope 2 (Market-based)</span>. 
                Emissions will be calculated instantly upon confirmation.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="group relative w-full bg-gt-green-900 hover:bg-black text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl hover:shadow-gt-green-500/20 active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gt-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                Calculate Impact <ArrowUpRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Stage: Result */}
      {stage === "result" && result && (
        <div className="space-y-8 animate-scale-in">
          <div className="premium-card p-12 text-center space-y-10 border-none bg-white/60 backdrop-blur-2xl">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gt-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-gt-green-500/40 rotate-6 animate-fade-in">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Impact Calculated
                </h2>
                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mt-2">
                  Transaction ID: GT-{Math.random().toString(36).substr(2, 6).toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="relative p-12 rounded-[3rem] bg-black text-white overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-20 group">
                  <Leaf className="w-40 h-40 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
               </div>
               
               <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-4">
                    Total Carbon Footprint
                  </p>
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-7xl font-black tracking-tighter animate-fade-in">
                      {result.co2_kg.toFixed(2)}
                    </span>
                    <span className="text-2xl font-black opacity-40">kg CO₂e</span>
                  </div>
                </div>

                <div className="h-px bg-white/10 w-20 mx-auto" />

                <div className="flex justify-center gap-12">
                   <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Equivalent</p>
                      <p className="text-lg font-black">{result.equivalents.miles_driven.toLocaleString()} <span className="text-xs opacity-50">miles</span></p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Offset</p>
                      <p className="text-lg font-black">{result.equivalents.trees_one_year} <span className="text-xs opacity-50">trees</span></p>
                   </div>
                </div>
              </div>

              {/* Accent light */}
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gt-green-500/30 rounded-full blur-[80px]" />
            </div>

            <div className="grid grid-cols-3 gap-6">
               {[
                 { label: "Usage", value: `${usage} ${unit}` },
                 { label: "Factor", value: result.factor_used },
                 { label: "Scope", value: result.scope },
               ].map((stat, i) => (
                 <div key={i} className="p-6 rounded-3xl bg-bg-inset/50 border border-border-subtle text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">{stat.label}</p>
                    <p className="text-sm font-black text-text-primary">{stat.value}</p>
                 </div>
               ))}
            </div>
          </div>

          <div className="flex gap-6">
            <button
              type="button"
              onClick={reset}
              className="premium-card flex-1 py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:bg-gt-green-500 hover:text-white hover:border-transparent"
              style={{ color: "var(--text-secondary)" }}
            >
              Upload Another <Upload className="w-4 h-4" />
            </button>
            <Link
              href="/dashboard"
              className="group premium-card flex-1 bg-white py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:bg-black hover:text-white"
            >
              Back to Dashboard <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
