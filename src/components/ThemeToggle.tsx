"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/SettingsProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useSettings();

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
      className={cn(
        "h-7 w-12 rounded-full border border-white/20 bg-white/10 relative overflow-hidden",
        "transition-[background-color,border-color] duration-500 ease-out hover:bg-white/15 hover:border-white/30",
        className
      )}
    >
      {/* rail */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 transition-colors duration-500 ease-out" />
      </div>
      {/* knob */}
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full",
          "transition-all duration-500 ease-out shadow shadow-black/30",
          theme === "dark" ? "translate-x-1 bg-white/90" : "translate-x-6 bg-black/80"
        )}
      />
      {/* icons (monochrome) */}
      <div className={cn("absolute inset-0 flex items-center justify-between px-1", theme === "dark" ? "text-white/80" : "text-black/80")}> 
        {/* moon */}
        <svg
          className={cn("h-3.5 w-3.5 transition-opacity duration-500", theme === "dark" ? "opacity-80" : "opacity-30")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        {/* sun */}
        <svg
          className={cn("h-3.5 w-3.5 transition-opacity duration-500", theme === "light" ? "opacity-80" : "opacity-30")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </div>
    </button>
  );
}


