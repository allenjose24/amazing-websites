import { useEffect } from "react";
import { GooeyText } from "./components/ui/gooey-text-morphing";
import { ArrowUpRight } from "lucide-react";
import { animate, svg, stagger } from "animejs";
import svgData from "./amazing-websites-svg.json";
import { motion, useScroll, useTransform } from "framer-motion";

export default function LandingPage({ onLogin }) {
  // Bind scroll position to path drawing length
  const { scrollYProgress } = useScroll();
  const pathLength = useTransform(scrollYProgress, [0, 0.95], [0, 1]);

  useEffect(() => {
    // 1. Target the character path elements for the title
    const paths = document.querySelectorAll(".word-path-active");
    if (!paths.length) return;
    
    // Initially make them visible but with draw at 0%
    paths.forEach(p => {
      p.style.opacity = "1";
    });
    
    // 2. Create Anime.js v4 drawables for each letter path
    const drawables = Array.from(paths).map(path => svg.createDrawable(path));

    // 3. Animate a 20% active solid segment tracing the paths in an infinite loop
    animate(drawables, {
      draw: ["0 0.2", "0.8 1.0"],
      easing: "inOutSine",
      duration: 2500,
      delay: stagger(120),
      loop: true,
    });
  }, []);

  return (
    <div
      className="text-ink font-body w-full relative"
      style={{
        backgroundColor: "var(--color-paper, #f5f5f1)",
        backgroundImage: `
          radial-gradient(circle at 15% 15%, rgba(227, 91, 48, 0.05) 0%, transparent 40%),
          radial-gradient(circle at 85% 85%, rgba(182, 138, 53, 0.06) 0%, transparent 45%),
          linear-gradient(rgba(18, 21, 28, 0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(18, 21, 28, 0.015) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 100% 100%, 28px 28px, 28px 28px",
        minHeight: "300vh", // Spans the three full-screen sections
      }}
    >
      {/* Winding Scroll SVG Line */}
      <svg
        viewBox="0 0 1000 3000"
        fill="none"
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Vertical linear gradient to fade in the starting point of the path */}
          <linearGradient 
            id="line-gradient" 
            x1="0" 
            y1="540" 
            x2="0" 
            y2="3000" 
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--color-orange, #e35b30)" stopOpacity={0} />
            <stop offset="6%" stopColor="var(--color-orange, #e35b30)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--color-orange, #e35b30)" stopOpacity={1} />
          </linearGradient>
        </defs>
        {/* Active solid drawing trail linked to scroll progress (no guide track) */}
        <motion.path
          d="M 300 540 C 450 540, 850 500, 850 750 C 850 1000, 200 800, 200 1150 C 200 1350, 50 1400, 150 1500 C 250 1600, 850 1500, 850 1800 C 850 2100, 750 2100, 500 2250 C 250 2400, 200 2600, 500 2600 C 800 2600, 800 2400, 500 2400 C 400 2400, 480 2480, 500 2500"
          stroke="url(#line-gradient)"
          strokeWidth="72"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pathLength }}
        />
      </svg>

      {/* Section 1: Hero */}
      <section className="h-screen w-full flex flex-col justify-center relative z-20">
        <div className="mx-auto w-full px-6 md:px-[var(--s-5)]" style={{ maxWidth: 1200 }}>
          {/* Tag header */}
          <div className="flex items-center gap-[var(--s-2)] mb-[var(--s-4)]">
            <span
              style={{
                height: 8,
                width: 8,
                borderRadius: "50%",
                background: "var(--color-orange, #e35b30)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(18,21,28,0.75)",
                margin: 0,
              }}
            >
              Catalog No. 001 — Private Index
            </p>
          </div>

          {/* Animated SVG title with persistent outlines and looping active segment */}
          <div className="mb-[var(--s-4)] w-full overflow-visible" style={{ maxWidth: "min(100%, 750px)" }}>
            <svg 
              viewBox={`0 0 ${svgData.width} ${svgData.height}`}
              className="w-full h-auto text-ink overflow-visible"
              style={{ display: 'block' }}
            >
              <g transform="translate(0, 150) scale(1, -1)">
                {svgData.characters.map((char, index) => (
                  <g key={index}>
                    {/* Layer 1: Faint persistent character outline */}
                    <path
                      d={char.d}
                      fill="none"
                      stroke="rgba(18, 21, 28, 0.08)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Layer 2: Looping orange solid segment (no glow filter) */}
                    <path
                      d={char.d}
                      className="word-path-active"
                      fill="none"
                      stroke="var(--color-orange, #e35b30)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ opacity: 0 }}
                    />
                  </g>
                ))}
              </g>
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontWeight: 500,
              fontSize: "clamp(24px, 4vw, 36px)",
              lineHeight: 1.1,
              color: "rgba(18,21,28,0.85)",
              margin: 0,
            }}
          >
            A working archive of
          </h1>

          <div
            style={{
              position: "relative",
              height: "clamp(64px, 12vw, 150px)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <GooeyText
              texts={["Interfaces", "Animations", "AITools", "Typefaces", "Repositories"]}
              morphTime={1}
              cooldownTime={0.4}
              align="left"
              textClassName="font-display font-black text-orange text-[52px] sm:text-[76px] md:text-[104px] lg:text-[128px] tracking-tight"
            />
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontWeight: 500,
              fontSize: "clamp(24px, 4vw, 36px)",
              lineHeight: 1.1,
              color: "rgba(18,21,28,0.85)",
              margin: "0 0 var(--s-4) 0",
            }}
          >
            worth returning to.
          </h1>

          <div className="absolute bottom-[var(--s-3)] left-6 md:left-[var(--s-5)] animate-bounce font-mono text-[11px] uppercase tracking-widest text-ink/40 flex items-center gap-2">
            <span>↓ Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* Section 2: Philosophy Grid */}
      <section className="h-screen w-full flex flex-col justify-center relative z-20">
        <div className="mx-auto w-full px-6 md:px-[var(--s-5)]" style={{ maxWidth: 1200 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--s-4)]">
            
            {/* Card 1 */}
            <div className="bg-paper/80 backdrop-blur-md border border-ink/5 p-[var(--s-4)] rounded-2xl shadow-sm hover:border-orange/20 transition-all duration-300 md:mr-12">
              <span className="font-mono text-xs uppercase tracking-widest text-orange mb-2 block">Curation</span>
              <h2 className="font-display text-2xl font-semibold mb-3 text-ink/80">Strict Curation</h2>
              <p className="font-body text-sm text-ink/60 leading-relaxed">
                Every resource in this catalog has been selected, evaluated, and documented.
                We believe in cataloging details that inspire builders, rather than clipping bulk links.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-paper/80 backdrop-blur-md border border-ink/5 p-[var(--s-4)] rounded-2xl shadow-sm hover:border-orange/20 transition-all duration-300 md:ml-12 md:mt-24">
              <span className="font-mono text-xs uppercase tracking-widest text-orange mb-2 block">Interactive</span>
              <h2 className="font-display text-2xl font-semibold mb-3 text-ink/80">Active Sandbox</h2>
              <p className="font-body text-sm text-ink/60 leading-relaxed">
                Rather than screenshots, we track full code repositories, live APIs, and fluid HMR components. 
                Everything is preserved exactly as it was built to run.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Portal Gate */}
      <section className="h-screen w-full flex flex-col justify-center relative z-20">
        <div className="mx-auto w-full px-6 md:px-[var(--s-5)] flex flex-col items-center justify-center text-center" style={{ maxWidth: 1200 }}>
          
          <h2 className="font-display text-3xl md:text-5xl font-medium mb-6 text-ink/80 animate-pulse">
            Ready to explore?
          </h2>
          
          <p className="font-body text-base text-ink/50 max-w-[500px] mb-8 leading-relaxed">
            The archive is index-verified and ready. Step through the gate to access the private interface collection.
          </p>

          <button
            onClick={onLogin}
            className="group relative inline-flex items-center gap-[var(--s-2)] rounded-full bg-ink text-paper px-[var(--s-5)] py-[var(--s-3)] font-body font-medium text-[16px] transition-transform hover:scale-[1.03] shadow-lg"
          >
            Enter the Vault
            <ArrowUpRight
              size={18}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </section>
    </div>
  );
}