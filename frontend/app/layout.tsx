import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concept X-Ray",
  description: "Root-cause learning debugger — SIH26207 Smart Education",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white text-xs">CX</span>
              <span>Concept X-Ray</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/" className="text-slate-600 hover:text-brand-600 transition">Learner</Link>
              <Link href="/teacher" className="text-slate-600 hover:text-brand-600 transition">Teacher view</Link>
              <span className="hidden sm:inline text-xs text-slate-400">|</span>
              <span className="hidden sm:inline text-xs text-slate-500">
                SIH26207 · Smart Education
              </span>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
          Diagnoses are hypotheses, not verdicts.
        </footer>
      </body>
    </html>
  );
}
