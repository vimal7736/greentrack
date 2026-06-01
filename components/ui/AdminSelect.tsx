"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface AdminSelectOption {
  label: string;
  value: string;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function AdminSelect({ value, onChange, options, disabled, className = "", triggerClassName = "px-4 py-2.5 text-[10px]" }: AdminSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const selectedOption = options.find((o) => o.value === value) || options[0];

  const updatePosition = () => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 200),
      });
    }
  };

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true); // true to catch scrolling on any element
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if click is inside the container (trigger) or inside the dropdown (by checking a specific class or id, or since we close on select, just checking trigger is fine for now)
      // Actually, since portal is used, event.target might not be in containerRef.
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(".admin-select-dropdown")
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-3 rounded-xl font-black uppercase tracking-widest w-full transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName}`}
        style={{
          background: "var(--bg-inset)",
          color: "var(--text-primary)",
          border: "var(--card-border)",
          boxShadow: "var(--shadow-inset-xs)"
        }}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu via Portal */}
      {isOpen &&
        createPortal(
          <div
            className="absolute z-[9999] mt-2 py-2 px-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 admin-select-dropdown"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              backgroundColor: "var(--color-cream-200)",
              borderRadius: "24px",
              boxShadow: "var(--shadow-premium), 0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 my-0.5 rounded-[20px] font-bold text-xs uppercase tracking-[0.15em] transition-all duration-200 ${
                    isSelected
                      ? "bg-[#1a9c51] text-white shadow-md"
                      : "text-gray-900 hover:bg-black/5"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
