"use client";

import * as React from "react";

type SettingsContextValue = {
	breakingSpeed: number; // multiplier, 1 = default
	tickerSpeed: number; // multiplier, 1 = default
	setBreakingSpeed: (n: number) => void;
	setTickerSpeed: (n: number) => void;
	theme: "dark" | "light";
	setTheme: (t: "dark" | "light") => void;
};

const SettingsContext = React.createContext<SettingsContextValue | undefined>(undefined);

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	const [breakingSpeed, setBreakingSpeedState] = React.useState<number>(1);
	const [tickerSpeed, setTickerSpeedState] = React.useState<number>(1);
	const [theme, setThemeState] = React.useState<"dark" | "light">("dark");

	React.useEffect(() => {
		try {
			const b = Number(localStorage.getItem("breakingSpeed") || "1");
			const t = Number(localStorage.getItem("tickerSpeed") || "1");
			const savedTheme = (localStorage.getItem("theme") || "").toLowerCase();
			// Default to system if no saved theme
			const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			setBreakingSpeedState(clamp(isFinite(b) ? b : 1, 0.5, 3));
			setTickerSpeedState(clamp(isFinite(t) ? t : 1, 0.5, 3));
			if (savedTheme === "light" || savedTheme === "dark") {
				setThemeState(savedTheme as "dark" | "light");
			} else {
				setThemeState(prefersDark ? "dark" : "light");
			}
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

	// Theme setter persists and updates document attribute using View Transitions when available
	const setTheme = React.useCallback((t: "dark" | "light") => {
		try { localStorage.setItem("theme", t); } catch {}

		// Respect reduced motion
		const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const supportsVT = typeof document !== 'undefined' && 'startViewTransition' in document;

		if (supportsVT && !prefersReduced) {
			const root = document.documentElement;
			// Mark that we're using VT to avoid fallback CSS transitions
			root.classList.add('using-view-transitions');
			// @ts-expect-error startViewTransition is not yet in TS lib
			(document as any).startViewTransition(() => {
				// Apply DOM changes synchronously within the transition for smoothness
				root.setAttribute('data-theme', t);
				setThemeState(t);
			}).finished.finally(() => {
				root.classList.remove('using-view-transitions');
			});
			return;
		}

		// Fallback: just update state; effect will handle attribute + lightweight transitions
		setThemeState(t);
	}, []);

	// Apply theme attribute and enable smooth transitions when not using View Transitions
	React.useEffect(() => {
		const root = document.documentElement;
		if (root.getAttribute('data-theme') !== theme) {
			root.setAttribute('data-theme', theme);
		}

		const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const usingVT = root.classList.contains('using-view-transitions');
		if (prefersReduced || usingVT) return;

		const body = document.body;
		body.classList.add('theme-transition');
		const id = window.setTimeout(() => body.classList.remove('theme-transition'), 450);
		return () => { clearTimeout(id); body.classList.remove('theme-transition'); };
	}, [theme]);

	const value = React.useMemo(() => ({ breakingSpeed, tickerSpeed, setBreakingSpeed, setTickerSpeed, theme, setTheme }), [breakingSpeed, tickerSpeed, setBreakingSpeed, setTickerSpeed, theme, setTheme]);

	return (
		<SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
	);
}

export function useSettings(): SettingsContextValue {
	const ctx = React.useContext(SettingsContext);
	if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
	return ctx;
}


