"use client";

import * as React from "react";

type SettingsContextValue = {
  breakingSpeed: number; // multiplier, 1 = default
  tickerSpeed: number; // multiplier, 1 = default
  setBreakingSpeed: (n: number) => void;
  setTickerSpeed: (n: number) => void;
};

const SettingsContext = React.createContext<SettingsContextValue | undefined>(undefined);

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [breakingSpeed, setBreakingSpeedState] = React.useState<number>(1);
  const [tickerSpeed, setTickerSpeedState] = React.useState<number>(1);

  React.useEffect(() => {
    try {
      const b = Number(localStorage.getItem("breakingSpeed") || "1");
      const t = Number(localStorage.getItem("tickerSpeed") || "1");
      setBreakingSpeedState(clamp(isFinite(b) ? b : 1, 0.5, 3));
      setTickerSpeedState(clamp(isFinite(t) ? t : 1, 0.5, 3));
    } catch {}
  }, []);

  const setBreakingSpeed = React.useCallback((n: number) => {
    const v = clamp(n, 0.5, 3);
    setBreakingSpeedState(v);
    try { localStorage.setItem("breakingSpeed", String(v)); } catch {}
  }, []);

  const setTickerSpeed = React.useCallback((n: number) => {
    const v = clamp(n, 0.5, 3);
    setTickerSpeedState(v);
    try { localStorage.setItem("tickerSpeed", String(v)); } catch {}
  }, []);

  const value = React.useMemo(() => ({ breakingSpeed, tickerSpeed, setBreakingSpeed, setTickerSpeed }), [breakingSpeed, tickerSpeed, setBreakingSpeed, setTickerSpeed]);

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}


