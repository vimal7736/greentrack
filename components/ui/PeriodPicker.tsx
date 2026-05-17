"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface PeriodPickerProps {
  label:          string;
  color:          string; // "var(--brand-green)" or "var(--brand-orange)"
  from:           string;
  to:             string;
  onFromChange:   (v: string) => void;
  onToChange:     (v: string) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function MonthPickerField({
  label,
  value,
  onChange,
  themeColor
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  themeColor: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM
  const [yearStr, monthStr] = value.split("-");
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const monthIndex = isNaN(parseInt(monthStr, 10)) ? 0 : parseInt(monthStr, 10) - 1;

  // Track the year in focus
  const [viewYear, setViewYear] = useState(year);

  // Sync viewYear when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setViewYear(year);
    }
  }, [isOpen, year]);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleMonthSelect = (mIndex: number) => {
    const formattedMonth = String(mIndex + 1).padStart(2, "0");
    onChange(`${viewYear}-${formattedMonth}`);
    setIsOpen(false);
  };

  const handleQuickThisMonth = () => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, "0");
    onChange(`${curYear}-${curMonth}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-text-muted opacity-50">{label}</p>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-bg-inset/50 hover:bg-bg-inset/80 border border-border-subtle/50 hover:border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary transition-all outline-none text-left"
        style={{
          borderColor: isOpen ? themeColor : "transparent",
          boxShadow: isOpen ? `0 0 16px ${themeColor}1a` : "none"
        }}
      >
        <span className="truncate font-black">
          {FULL_MONTHS[monthIndex]} {year}
        </span>
        <Calendar className="w-4 h-4 text-text-muted opacity-60 ml-2 shrink-0" />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-64 rounded-2xl p-4 shadow-2xl animate-fade-in z-50 border border-border-subtle"
          style={{
            background: "var(--neu-base)",
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Year Switcher Header */}
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle/30 pb-2">
            <button
              type="button"
              onClick={() => setViewYear(viewYear - 1)}
              className="p-1.5 rounded-lg bg-bg-inset/40 hover:bg-bg-inset/80 text-text-primary hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-text-primary tracking-wide">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear(viewYear + 1)}
              className="p-1.5 rounded-lg bg-bg-inset/40 hover:bg-bg-inset/80 text-text-primary hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Months Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {MONTHS.map((m, idx) => {
              const isSelected = idx === monthIndex && viewYear === year;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthSelect(idx)}
                  className="py-2.5 text-xs font-black rounded-xl transition-all duration-200"
                  style={{
                    backgroundColor: isSelected ? themeColor : "transparent",
                    color: isSelected ? "#000000" : "var(--text-primary)",
                    border: isSelected ? `1px solid ${themeColor}` : "1px solid transparent"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/30 text-[10px] font-black uppercase tracking-wider text-text-muted">
            <button
              type="button"
              onClick={handleQuickThisMonth}
              className="hover:text-text-primary transition-colors"
            >
              This Month
            </button>
            <span className="opacity-30">|</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="hover:text-text-primary transition-colors text-right"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PeriodPicker({ label, color, from, to, onFromChange, onToChange }: PeriodPickerProps) {
  return (
    <div className="premium-card p-6 relative group">
      {/* Left glowing colored bar with rounded-l-2xl matching the card's rounded borders */}
      <div className="absolute top-0 left-0 w-1.5 h-full opacity-70 rounded-l-2xl" style={{ background: color }} />
      
      <div className="flex items-center justify-between mb-6 pl-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg bg-bg-inset flex items-center justify-center group-hover:scale-110 transition-transform">
          <Calendar className="w-4 h-4 text-text-muted" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pl-2">
        <MonthPickerField
          label="Start Month"
          value={from}
          onChange={onFromChange}
          themeColor={color}
        />
        <MonthPickerField
          label="End Month"
          value={to}
          onChange={onToChange}
          themeColor={color}
        />
      </div>
    </div>
  );
}
