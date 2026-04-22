"use client";

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyPoint { month: string; co2: number; kwh: number }
interface ByType { type: string; co2_kg: number }

interface Props {
  monthlyChart: MonthlyPoint[];
  byType: ByType[];
  totalCo2: number;
}

const TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas: "Gas",
  water: "Water",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
};

const TYPE_COLORS: Record<string, string> = {
  electricity: "#22c55e",
  gas: "#3b82f6",
  water: "#06b6d4",
  fuel_diesel: "#f59e0b",
  fuel_petrol: "#f97316",
};

export default function DashboardCharts({ monthlyChart, byType, totalCo2 }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* CO2 Area Chart */}
      <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly CO₂ Emissions (kg)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyChart}>
            <defs>
              <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => [`${v} kg`, "CO₂e"]} />
            <Area type="monotone" dataKey="co2" stroke="#16a34a" fill="url(#co2Grad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Emissions by Type */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Emissions by Type</h2>
        <div className="space-y-3">
          {byType.map(({ type, co2_kg }) => {
            const pct = totalCo2 > 0 ? ((co2_kg / totalCo2) * 100).toFixed(0) : "0";
            const label = TYPE_LABELS[type] ?? type;
            const color = TYPE_COLORS[type] ?? "#6b7280";
            return (
              <div key={type}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{label}</span>
                  <span>{co2_kg.toFixed(1)} kg ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Scope breakdown */}
        <div className="mt-5">
          <h3 className="text-xs font-semibold text-gray-500 mb-2">SECR Scope Split</h3>
          <div className="flex gap-2">
            {[
              { label: "Scope 1", types: ["gas", "fuel_diesel", "fuel_petrol"], color: "blue" },
              { label: "Scope 2", types: ["electricity"], color: "green" },
            ].map(({ label, types, color }) => {
              const kg = byType
                .filter((b) => types.includes(b.type))
                .reduce((s, b) => s + b.co2_kg, 0);
              return (
                <div key={label} className={`flex-1 bg-${color}-50 rounded-lg p-3 text-center`}>
                  <p className={`text-xs text-${color}-600 font-medium`}>{label}</p>
                  <p className={`text-sm font-bold text-${color}-800`}>{kg.toFixed(0)} kg</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Energy kWh bar chart */}
      <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Energy Consumption (kWh)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="kwh" fill="#16a34a" radius={[4, 4, 0, 0]} name="kWh" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
