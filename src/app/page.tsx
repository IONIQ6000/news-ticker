import { NewsTicker } from "@/components/NewsTicker";
import { BreakingTicker } from "@/components/BreakingTicker";
import { SettingsMenu } from "@/components/SettingsMenu";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="text-lg font-semibold uppercase tracking-[0.12em]">Ticker</div>
          <nav className="flex items-center gap-4">
            <div className="text-sm text-white/60">Modern News Ticker</div>
            <SettingsMenu />
          </nav>
        </div>
      </header>
      <BreakingTicker />
      <NewsTicker />
      <main className="mx-auto max-w-6xl px-6 py-12 grid gap-8">
        <section>
          <h2 className="text-lg font-medium">Live topic-based headlines</h2>
          <p className="text-white/60 mt-2">
            The ticker above streams headlines filtered by a topic you set in the backend.
          </p>
        </section>
      </main>
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-8 text-white/40 text-sm">
          Built with Next.js, Tailwind, and shadcn/ui
        </div>
      </footer>
    </div>
  );
}
