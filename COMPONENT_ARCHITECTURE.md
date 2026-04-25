# GreenTrack AI — Component Architecture & Reusability Guide

This document explains **exactly** what was done to refactor the History page into a modular, reusable system — and how every other developer should follow the same pattern for every page going forward.

---

## The Problem: "Copy-Paste Code"

Before the refactor, the History page (and every other page) had the same code written over and over again in isolation:

```
dashboard/page.tsx  → had its own <table>, its own <button>, its own loading spinner
history/page.tsx    → had its own <table>, its own <button>, its own loading spinner
reports/page.tsx    → had its own <table>, its own <button>, its own loading spinner
```

**The Risk:** If you want to change the button style across the whole app, you had to find and update it in 8 different files. One missed file = inconsistency. One typo = bug.

---

## The Solution: A Shared Component Library

We split the code into 4 distinct layers. Each layer has one job.

```
types/         → "What shape is the data?" (TypeScript types)
lib/           → "What are the rules?" (constants, utility functions)
components/ui/ → "What does it look like?" (UI building blocks)
app/           → "What does the page do?" (business logic + composition)
```

---

## Layer 1: Types (`types/index.ts`)

**The job:** Define the exact shape of every data object in the system, once.

### Before (Inside `history/page.tsx`):
```typescript
// This was defined locally — disconnected from the real database schema
interface Bill {
  id:           string;
  bill_type:    string;
  bill_date:    string;
  usage_amount: number;
  usage_unit:   string;
  co2_kg:       number;
  cost_gbp:     number | null;
  supplier:     string | null;
  pdf_url:      string | null;
  created_at:   string;
  // MISSING: org_id, account_number, ocr_raw — which ARE in the database
}

interface ApiResponse {
  bills:       Bill[];
  total:       number;
  page:        number;
  total_pages: number;
  summary:     { total_co2_kg: number; total_cost_gbp: number };
}
```

### After (In `types/index.ts`, used everywhere):
```typescript
// Added to types/index.ts — the single source of truth
export interface BillsSummary {
  total_co2_kg:   number;
  total_cost_gbp: number;
}

export interface BillsApiResponse {
  bills:       Bill[];
  total:       number;
  page:        number;
  total_pages: number;
  summary:     BillsSummary;
}
```

### In `history/page.tsx` now:
```typescript
// One line import. No duplication. 100% in sync with the DB schema.
import { type Bill, type BillsApiResponse } from "@/types";
```

**The Rule:** If it's a database row shape → it goes in `types/index.ts`. If it's an API response shape → it also goes in `types/index.ts`.

---

## Layer 2: Constants & Utilities (`lib/`)

### `lib/carbon/constants.ts` — The Carbon "Dictionary"

**The job:** Store all bill type labels, colors, and filter options in one place.

### Before (Copy-pasted in 4+ different files):
```typescript
// In dashboard/page.tsx:
const TYPE_LABELS = { electricity: "Electricity", gas: "Gas", ... };

// In history/page.tsx:
const BILL_TYPE_LABELS = { electricity: "Electricity", gas: "Gas", ... };
// SAME THING, different variable name — a mess.
```

### After:
```typescript
// lib/carbon/constants.ts — defined ONCE
export const BILL_TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas:         "Gas",
  water:       "Water",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
};

export const BILL_TYPE_BADGE_CLASSES: Record<string, string> = {
  electricity: "text-gt-green-600 bg-gt-green-500/10 border-gt-green-500/20",
  gas:         "text-blue-600 bg-blue-500/10 border-blue-500/20",
  // ...
};

export const BILL_TYPE_FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "electricity", label: "Electricity" },
  // ...
];
```

---

### `lib/utils/format.ts` — The Formatter

**The job:** Never format a number or date inline inside a component again.

### Before (Inline string formatting scattered everywhere):
```typescript
// Inside a JSX return — bad practice
<span>{(summary?.total_co2_kg / 1000).toFixed(3)} tCO₂e</span>
<span>{bill.cost_gbp != null ? `£${bill.cost_gbp.toFixed(2)}` : "—"}</span>
```

### After (Clean, readable, consistent):
```typescript
import { formatCarbonTonnes, formatCost } from "@/lib/utils/format";

<span>{formatCarbonTonnes(summary?.total_co2_kg ?? 0)}</span>
// → "1.234 tCO₂e"

<span>{formatCost(bill.cost_gbp)}</span>
// → "£42.50" or "—" if null
```

**Available formatters:**

| Function | Input | Output |
|---|---|---|
| `formatCarbon(kg)` | `1500` | `"1.50 tCO₂e"` |
| `formatCarbonKg(kg)` | `450.2` | `"450.2 kg"` |
| `formatCarbonTonnes(kg)` | `1234` | `"1.234 tCO₂e"` |
| `formatCost(gbp)` | `42.5` | `"£42.50"` |
| `formatCost(null)` | `null` | `"—"` |
| `formatDate(str)` | `"2024-01-15"` | `"15 Jan 2024"` |
| `formatUsage(amount, unit)` | `1500, "kWh"` | `"1,500 kWh"` |

---

## Layer 3: UI Components (`components/ui/`)

These are the visual "building blocks". They know nothing about carbon data or Supabase. They just render UI.

---

### `Button.tsx`

**The job:** One standard button component for the whole app. No more writing `className="... font-black uppercase tracking-widest ..."` 20 times.

```tsx
import { Button } from "@/components/ui/Button";

// Variants
<Button variant="primary">Save Changes</Button>
<Button variant="secondary" icon={<Download />}>Export CSV</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger" icon={<Trash2 />} disabled={isDeleting}>Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large CTA</Button>
```

---

### `Input.tsx`

**The job:** One standard text input. Handles the icon slot, focus state, label, and error message automatically.

```tsx
import { Input } from "@/components/ui/Input";

// Simple
<Input placeholder="Enter value..." value={val} onChange={setVal} />

// With icon and label
<Input
  label="Search Archive"
  icon={<Search className="w-4 h-4" />}
  placeholder="Search by supplier..."
/>

// With error
<Input label="Email" value={email} error="Please enter a valid email" />
```

---

### `DataTable.tsx` (The Most Powerful One)

**The job:** A generic table that works with **any data type**. You just define "columns" — the table handles loading state, empty state, hover effects, and the footer (pagination) slot automatically.

```tsx
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { type Bill } from "@/types";

// Step 1: Define your columns
const columns: ColumnDef<Bill>[] = [
  {
    key:    "type",
    header: "Status / Type",
    render: (bill) => <BillTypeBadge type={bill.bill_type} />,
  },
  {
    key:    "co2",
    header: "Carbon Impact",
    align:  "right",
    render: (bill) => `${bill.co2_kg.toFixed(1)} kg`,
  },
];

// Step 2: Use the table — it handles EVERYTHING else
<DataTable
  columns={columns}
  data={bills}
  rowKey={(b) => b.id}
  loading={isLoading}
  loadingLabel="Syncing Data..."
  emptyIcon={<Search className="w-10 h-10" />}
  emptyTitle="No Records Found"
  emptyMessage="Try adjusting your filters..."
  emptyCtaLabel="Upload First Bill"
  emptyCtaHref="/upload"
  footer={<Pagination ... />}
/>
```

> **Why generic (`DataTable<T>`)?** You can use this same component for a Team Members table, an Emission Factors table, an Invoices table — any data. You just change the type `T` and the column definitions.

---

### Other Shared UI Components

| Component | Usage |
|---|---|
| `PageHeader` | Icon + Title + Subtitle + right slot. Used on every single page. |
| `PageBackground` | The atmospheric green/orange blur blobs. One import = consistent on all pages. |
| `StatCard` | The premium bento stat cards. Used on History, Dashboard, Targets. |
| `Spinner` | Standard branded loading spinner. |
| `EmptyState` | Empty state with icon, title, description, and CTA button. |
| `BillTypeBadge` | Colored badge for Electricity / Gas / Diesel etc. |
| `Pagination` | Prev / Next / page number controls. |

---

## The Final Result: History Page Comparison

### Before (397 lines, everything inline)
```tsx
// Raw HTML table with no abstraction
<table className="w-full text-sm">
  <thead>
    <tr className="bg-bg-inset/20 border-b border-border-subtle">
      <th className="text-left px-8 py-5 text-[10px] font-black ...">Status / Type</th>
      ...
    </tr>
  </thead>
  <tbody>
    {loading && <tr><td colSpan={7}>... spinner code ...</td></tr>}
    {!loading && bills.length === 0 && <tr><td>... empty state code ...</td></tr>}
    {bills.map((bill) => { ... })}
  </tbody>
</table>

// Plus raw pagination buttons
<button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
```

### After (233 lines, fully composed)
```tsx
// Column definition (data-driven, not markup-driven)
const columns: ColumnDef<Bill>[] = [
  { key: "type", header: "Status / Type", render: (bill) => <BillTypeBadge type={bill.bill_type} /> },
  { key: "co2",  header: "Carbon Impact",  align: "right", render: (bill) => `${bill.co2_kg} kg` },
];

// One component — handles loading, empty state, rows, and footer
<DataTable columns={columns} data={bills} rowKey={(b) => b.id} loading={loading} footer={<Pagination ... />} />
```

---

## The Golden Rules (For Every Future Page)

1. **Types** → Always import from `@/types`. Never define a local interface for DB data.
2. **Labels/Colors** → Always import from `@/lib/carbon/constants`. Never duplicate string maps.
3. **Number/Date Formatting** → Always use `@/lib/utils/format`. Never format inline in JSX.
4. **Button** → Always use `<Button variant="..." size="...">`. Never write raw `<button className="...font-black uppercase...">`.
5. **Input** → Always use `<Input icon={...} label={...}>`. Never write raw `<input className="...border-2...">`.
6. **Tables** → Always use `<DataTable columns={...} data={...}>`. Never write raw `<table>/<thead>/<tbody>`.
7. **Page Layout** → Always use `<PageHeader>` and `<PageBackground>`. Never copy-paste the header block.

---

## How to Add a New Page Using This System

```tsx
// Step 1: Import your type
import { type Bill } from "@/types";

// Step 2: Import formatters
import { formatCost, formatCarbonTonnes } from "@/lib/utils/format";

// Step 3: Import carbon constants
import { BILL_TYPE_LABELS } from "@/lib/carbon/constants";

// Step 4: Import UI components
import { PageHeader, PageBackground, StatCard, Button, Input, DataTable } from "@/components/ui/...";

// Step 5: Define columns and compose
const columns: ColumnDef<YourType>[] = [ ... ];

return (
  <div>
    <PageBackground />
    <PageHeader icon={...} title="..." subtitle="..." />
    <DataTable columns={columns} data={data} ... />
  </div>
);
```

That is the complete pattern. Every page should look like this.
