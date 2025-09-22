"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(
    typeof window !== "undefined" ? ((localStorage.getItem("theme") as ThemeMode) || "system") : "system"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("theme", "system");
    }
  }, [theme]);

  const cycle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : prev === "dark" ? "system" : "light"));
  };

  const label = theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "🖥️";
  const text = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <button
      onClick={cycle}
      className="ui-btn ui-btn-secondary text-xs"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <span>{label}</span>
      <span>{text}</span>
    </button>
  );
}


