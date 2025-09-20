import NewsTicker from "@/components/NewsTicker";
import BreakingTicker from "@/components/BreakingTicker";
import { SettingsMenu } from "@/components/SettingsMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ maxWidth: '100vw' }}>
      <header className="border-b border-white/10 overflow-hidden" style={{ maxWidth: '100vw' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-between overflow-hidden" style={{ maxWidth: '100vw' }}>
          <div className="flex flex-col pb-3">
            <div className="text-base sm:text-lg font-semibold uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-display)" }}>Ticker</div>
            <div className="text-[8px] sm:text-[9px] text-white/70 leading-tight whitespace-nowrap mt-0">Modern News Ticker</div>
          </div>
          <nav className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            <ThemeToggle />
            <SettingsMenu />
          </nav>
        </div>
      </header>
      <BreakingTicker />
      <NewsTicker />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 grid gap-6 sm:gap-8 overflow-hidden" style={{ maxWidth: '100vw' }}>
        <section>
          <h2 className="text-base sm:text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>Live topic-based headlines</h2>
          <p className="text-white/60 mt-2 text-sm sm:text-base">
            The ticker above streams headlines filtered by a topic you set in the backend.
          </p>
        </section>
      </main>
      <footer className="border-t border-white/10 overflow-hidden" style={{ maxWidth: '100vw' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 text-white/40 text-xs sm:text-sm overflow-hidden" style={{ maxWidth: '100vw' }}>
          Built with Next.js, Tailwind, and shadcn/ui
        </div>
      </footer>
    </div>
  );
}
