"use client";

import * as React from "react";
import { useSettings } from "@/components/SettingsProvider";
import { cn } from "@/lib/utils";

export function SettingsMenu({ className }: { className?: string }) {
  const { breakingSpeed, tickerSpeed, setBreakingSpeed, setTickerSpeed } = useSettings();
  const [open, setOpen] = React.useState(false);
  const [render, setRender] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const FADE_IN_MS = 275;
  const FADE_OUT_MS = 600;

  React.useEffect(() => {
    if (open) {
      setRender(true);
      setVisible(false);
      let r1 = 0; let r2 = 0;
      r1 = requestAnimationFrame(() => {
        // Force reflow to ensure initial styles apply before transitioning
        void panelRef.current?.getBoundingClientRect();
        r2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    } else {
      setVisible(false);
      const t = setTimeout(() => setRender(false), FADE_OUT_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on outside click
  React.useEffect(() => {
    if (!render) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [render]);

  // Close on Esc
  React.useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [render]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1.5 text-xs rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 backdrop-blur bg-white/5"
      >
        Settings
      </button>
      {render && (
        <>
        <div
          className={cn(
            "fixed inset-0 z-40",
            "transition-opacity ease-in-out",
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{ transitionDuration: `${visible ? FADE_IN_MS : FADE_OUT_MS}ms` }}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute right-0 mt-2 w-80 z-50 rounded-xl ring-1 ring-white/20 border border-white/10 bg-white/20 backdrop-blur-md backdrop-saturate-150 shadow-xl shadow-black/30 supports-[backdrop-filter]:bg-white/12",
            "transition-opacity ease-in-out",
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{ willChange: 'opacity', transitionDuration: `${visible ? FADE_IN_MS : FADE_OUT_MS}ms` }}
          ref={panelRef}
          aria-hidden={!visible}
        >
          <div className="p-4">
            <div className="text-white/80 text-sm font-medium mb-3">Ticker Speeds</div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60">Breaking ticker speed</span>
                <span className="text-xs text-white/60">{breakingSpeed.toFixed(2)}x</span>
              </div>
              <input
                className="w-full h-2 appearance-none bg-white/15 rounded-full [accent-color:white]"
                type="range" min={0.5} max={3} step={0.05}
                value={breakingSpeed}
                onChange={(e) => setBreakingSpeed(Number(e.target.value))}
              />
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60">Headlines ticker speed</span>
                <span className="text-xs text-white/60">{tickerSpeed.toFixed(2)}x</span>
              </div>
              <input
                className="w-full h-2 appearance-none bg-white/15 rounded-full [accent-color:white]"
                type="range" min={0.5} max={3} step={0.05}
                value={tickerSpeed}
                onChange={(e) => setTickerSpeed(Number(e.target.value))}
              />
            </div>

          </div>
        </div>
        </>
      )}
    </div>
  );
}


