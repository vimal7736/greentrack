import React from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
  align?: "left" | "center" | "right";
}

export function Tooltip({ content, children, className = "", position = "top", align = "center" }: TooltipProps) {
  const positionClasses = {
    top: `bottom-full mb-2.5 ${
      align === "center" ? "left-1/2 -translate-x-1/2" : align === "left" ? "left-0" : "right-0"
    }`,
    bottom: `top-full mt-2.5 ${
      align === "center" ? "left-1/2 -translate-x-1/2" : align === "left" ? "left-0" : "right-0"
    }`,
    left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
  };

  return (
    <div className={`relative group inline-block ${className}`}>
      {children}
      <div 
        className={`absolute hidden group-hover:block w-64 p-3.5 text-[11px] leading-relaxed font-bold rounded-2xl border transition-all duration-300 pointer-events-none z-[100] ${positionClasses[position]}`}
        style={{
          background: "var(--bg-inset)",
          borderColor: "rgba(34, 197, 94, 0.15)",
          color: "var(--text-secondary)",
          boxShadow: "var(--shadow-inset-sm), 0 10px 25px -5px rgba(0, 0, 0, 0.05)",
        }}
      >
        {content}
      </div>
    </div>
  );
}
