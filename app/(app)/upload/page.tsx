"use client";
import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, Edit3, Zap, Flame, Droplets, Fuel } from "lucide-react";

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
    <div className="mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Bill</h1>
        <p className="text-gray-500 text-sm mt-1">Upload a PDF utility bill and we'll extract the data automatically</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {["Upload", "Processing", "Review", "Result"].map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done ? "bg-green-600 text-white" : active ? "bg-green-100 text-green-700 border-2 border-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-xs ${active ? "text-green-700 font-semibold" : "text-gray-400"}`}>{s}</span>
              {i < 3 && <div className="w-8 h-px bg-gray-200" />}
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bill Type</label>
            <div className="grid grid-cols-5 gap-2">
              {BILL_TYPES.map(({ key, label, sub, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBillType(key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${
                    billType === key
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {icon}
                  {label}
                  {sub && <span className="text-xs opacity-60">{sub}</span>}
                </button>
              ))}
            </div>
          </div>

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
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
              dragOver ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-400 hover:bg-green-50/50"
            }`}
          >
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Drag & drop your PDF bill here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse — PDF only, max 10 MB</p>
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            Powered by Mindee OCR — your bill is processed securely and never stored in plain text
          </p>
        </div>
      )}

      {/* Stage: Processing */}
      {stage === "processing" && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-4">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-semibold text-gray-800">Processing {fileName}</p>
          <p className="text-sm text-gray-500">Mindee OCR is extracting your bill data…</p>
          <div className="flex flex-col items-center gap-1.5 text-xs text-gray-400">
            <span>✓ File uploaded securely</span>
            <span className="animate-pulse">⟳ Extracting usage figures…</span>
          </div>
        </div>
      )}

      {/* Stage: Review */}
      {stage === "review" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-800">
              {ocr ? "OCR Extraction Complete — Please Review" : "Enter Bill Details Manually"}
            </h2>
          </div>

          {ocr && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm space-y-2">
              {ocr.supplier && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier</span>
                  <span className="font-medium">{ocr.supplier}</span>
                </div>
              )}
              {ocr.bill_period && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Bill Period</span>
                  <span className="font-medium">{ocr.bill_period}</span>
                </div>
              )}
              {ocr.account_number && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Account No.</span>
                  <span className="font-medium">{ocr.account_number}</span>
                </div>
              )}
              {ocr.amount_due != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Due</span>
                  <span className="font-medium">£{Number(ocr.amount_due).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost (£) <span className="text-gray-400 font-normal">optional</span>
              </label>
              <input
                type="number"
                value={costGbp}
                onChange={(e) => setCostGbp(e.target.value)}
                placeholder="e.g. 312.40"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usage <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">— edit if OCR was incorrect</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  placeholder="e.g. 1240"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-16"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400">{unit}</span>
              </div>
              <Edit3 className="w-4 h-4 text-gray-400 self-center" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              The correct 2025 DEFRA emission factor for <strong>{billType}</strong> will be automatically
              applied when you save. Emission factors are date-based for SECR accuracy.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors"
          >
            Calculate & Save →
          </button>
        </div>
      )}

      {/* Stage: Result */}
      {stage === "result" && result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Bill Saved Successfully</h2>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <p className="text-xs text-green-700 font-medium mb-1">CO₂ Emissions for this bill</p>
              <p className="text-4xl font-bold text-green-800">
                {result.co2_kg.toFixed(2)} <span className="text-lg font-normal">kg CO₂e</span>
              </p>
              <p className="text-sm text-green-600 mt-1">{(result.co2_kg / 1000).toFixed(4)} tonnes CO₂e</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Real-world equivalent</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  🚗 {result.equivalents.miles_driven.toLocaleString()} miles driven
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Trees needed to offset</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  🌳 {result.equivalents.trees_one_year} trees for 1 year
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-400 text-left space-y-1 border-t border-gray-100 pt-4">
              <p>Usage: <strong>{usage} {unit}</strong></p>
              <p>Factor: <strong>{result.factor_used} kgCO₂e/{unit}</strong> (2025 DEFRA)</p>
              <p>Scope: <strong>{result.scope}</strong> — {billType}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Upload Another Bill
            </button>
            <a
              href="/dashboard"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium text-center transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
