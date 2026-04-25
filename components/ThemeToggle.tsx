"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

interface Props {
  buttonStyle?: React.CSSProperties;
}

export function ThemeToggle({ buttonStyle }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-xl opacity-40"
        style={buttonStyle ?? {
          background: "linear-gradient(145deg, var(--neu-light), var(--neu-base))",
          boxShadow: "var(--shadow-raised)",
        }}
      />
    );
  }

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const Icon    = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label   = theme === "light" ? "Switch to dark mode" : theme === "dark" ? "Switch to system theme" : "Switch to light mode";

  const defaultStyle: React.CSSProperties = {
    background: "linear-gradient(145deg, var(--neu-light), var(--neu-base))",
    boxShadow:  "var(--shadow-raised)",
    border:     "var(--card-border)",
    borderRadius: "10px",
    color:      "var(--text-secondary)",
    cursor:     "pointer",
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="w-9 h-9 flex items-center justify-center transition-colors duration-150"
      style={buttonStyle ?? defaultStyle}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}
