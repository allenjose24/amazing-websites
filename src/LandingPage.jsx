import React from "react";
import { GooeyText } from "./components/ui/gooey-text-morphing";
import { ArrowUpRight } from "lucide-react";

const CATALOG = [
  { id: "01", label: "UI / UX Design" },
  { id: "02", label: "Animations" },
  { id: "03", label: "AI Tools" },
  { id: "04", label: "Fonts" },
  { id: "05", label: "Code & Repos" },
];

export default function LandingPage({ onLogin }) {
  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <div className="mx-auto max-w-[1200px] px-6 md:px-[var(--s-5)] py-[var(--s-6)] md:py-[var(--s-7)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.618fr_1fr] gap-[var(--s-6)] lg:gap-[var(--s-5)] items-start">

          {/* Left: the hero thesis */}
          <div>
            <div className="flex items-center gap-[var(--s-2)] mb-[var(--s-4)]">
              <span className="h-2 w-2 rounded-full bg-orange" />
              <p className="font-mono text-[13px] tracking-[0.18em] uppercase text-ink/60">
                Catalog No. 001 — Private Index
              </p>
            </div>

            <h1 className="font-display font-medium text-[34px] md:text-[42px] leading-[1.1] text-ink/80">
              A working archive of
            </h1>

            <div className="relative h-[80px] sm:h-[110px] md:h-[150px] lg:h-[180px] flex items-center">
              <GooeyText
                texts={["Interfaces", "Animations", "AITools", "Typefaces", "Repositories"]}
                morphTime={1}
                cooldownTime={0.4}
                align="left"
                textClassName="font-display font-black text-orange text-[52px] sm:text-[76px] md:text-[104px] lg:text-[128px] tracking-tight"
              />
            </div>

            <h1 className="font-display font-medium text-[34px] md:text-[42px] leading-[1.1] text-ink/80 mb-[var(--s-5)]">
              worth returning to.
            </h1>

            <p className="font-body text-[18px] md:text-[21px] leading-[1.6] text-ink/70 max-w-[480px] mb-[var(--s-5)]">
              Nothing here was clipped and forgotten. Every entry is checked,
              tagged, and kept somewhere I can actually find it again.
            </p>

            <button
              onClick={onLogin}
              className="group inline-flex items-center gap-[var(--s-2)] rounded-full bg-ink text-paper px-[var(--s-4)] py-[var(--s-2)] font-body font-medium text-[15px] transition-transform hover:scale-[1.03]"
            >
              Enter the Vault
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>

          {/* Right: catalog index — the signature element */}
          <div className="lg:pt-[var(--s-6)]">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/40 mb-[var(--s-3)]">
              Index
            </p>
            <ul className="border-t border-ink/10">
              {CATALOG.map((item) => (
                <li
                  key={item.id}
                  className="group flex items-baseline justify-between border-b border-ink/10 py-[var(--s-3)]"
                >
                  <span className="flex items-baseline gap-[var(--s-3)]">
                    <span className="font-mono text-[13px] text-brass">{item.id}</span>
                    <span className="font-display text-[19px] text-ink/85">{item.label}</span>
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="text-ink/30 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                  />
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}