import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SquareArrowOutUpRight, X, ArrowUpRight, ChevronRight } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function wrapIndex(n, len) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

/** Minimal signed offset from active index to i, with wrapping (for loop behavior). */
function signedOffset(i, active, len, loop) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;

  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

export function CardStack({
  items,

  /** Selected index on mount */
  initialIndex = 0,

  /** How many cards are visible around the active (odd recommended) */
  maxVisible = 7,

  /** Card sizing */
  cardWidth = 480,
  cardHeight = 290,

  /** How much cards overlap each other (0..0.8). Higher = more overlap */
  overlap = 0.48,

  /** Total fan angle (deg). Higher = wider arc */
  spreadDeg = 48,

  /** 3D / depth feel */
  perspectivePx = 1100,
  depthPx = 140,
  tiltXDeg = 12,

  /** Active emphasis */
  activeLiftPx = 22,
  activeScale = 1.03,
  inactiveScale = 0.94,

  /** Motion */
  springStiffness = 280,
  springDamping = 28,

  /** Behavior */
  loop = true,
  autoAdvance = false,
  intervalMs = 2800,
  pauseOnHover = true,

  /** UI */
  showDots = true,
  className,

  /** Hooks */
  onChangeIndex,

  /** Custom renderer (optional) */
  renderCard,
}) {
  const reduceMotion = useReducedMotion();
  const len = items.length;

  const [active, setActive] = React.useState(() => wrapIndex(initialIndex, len));
  const [hovering, setHovering] = React.useState(false);

  React.useEffect(() => {
    setActive((a) => wrapIndex(a, len));
  }, [len]);

  React.useEffect(() => {
    if (!len) return;
    onChangeIndex?.(active, items[active]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const canGoPrev = loop || active > 0;
  const canGoNext = loop || active < len - 1;

  const prev = React.useCallback(() => {
    if (!len || !canGoPrev) return;
    setActive((a) => wrapIndex(a - 1, len));
  }, [canGoPrev, len]);

  const next = React.useCallback(() => {
    if (!len || !canGoNext) return;
    setActive((a) => wrapIndex(a + 1, len));
  }, [canGoNext, len]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  React.useEffect(() => {
    if (!autoAdvance || reduceMotion || !len) return;
    if (pauseOnHover && hovering) return;

    const id = window.setInterval(
      () => {
        if (loop || active < len - 1) next();
      },
      Math.max(700, intervalMs),
    );

    return () => window.clearInterval(id);
  }, [autoAdvance, intervalMs, hovering, pauseOnHover, reduceMotion, len, loop, active, next]);

  if (!len) return null;

  const activeItem = items[active];

  return (
    <div
      className={cn("w-full", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="relative w-full"
        style={{ height: Math.max(380, cardHeight + 80) }}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* ambient glow — brand-tinted instead of generic black/white */}
        <div
          className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-48 w-[70%] rounded-full bg-forest/5 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-40 w-[76%] rounded-full bg-ink/10 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{ perspective: `${perspectivePx}px` }}
        >
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, active, len, loop);
              const abs = Math.abs(off);
              const visible = abs <= maxOffset;
              if (!visible) return null;

              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const y = abs * 10;
              const z = -abs * depthPx;

              const isActive = off === 0;
              const scale = isActive ? activeScale : inactiveScale;
              const lift = isActive ? -activeLiftPx : 0;
              const rotateX = isActive ? 0 : tiltXDeg;
              const zIndex = 100 - abs;

              const dragProps = isActive
                ? {
                    drag: "x",
                    dragConstraints: { left: 0, right: 0 },
                    dragElastic: 0.18,
                    onDragEnd: (_e, info) => {
                      if (reduceMotion) return;
                      const travel = info.offset.x;
                      const v = info.velocity.x;
                      const threshold = Math.min(160, cardWidth * 0.22);
                      if (travel > threshold || v > 650) prev();
                      else if (travel < -threshold || v < -650) next();
                    },
                  }
                : {};

              return (
                <motion.div
                  key={item.id}
                  className={cn(
                    "absolute bottom-0 rounded-2xl border border-ink/10 overflow-hidden",
                    "shadow-[0_40px_80px_-24px_rgba(18,21,28,0.25)] bg-white",
                    "will-change-transform select-none",
                    isActive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                  )}
                  style={{ width: cardWidth, height: cardHeight, zIndex, transformStyle: "preserve-3d" }}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: y + 40, x, rotateZ, rotateX, scale }
                  }
                  animate={{ opacity: 1, x, y: y + lift, rotateZ, rotateX, scale }}
                  transition={{ type: "spring", stiffness: springStiffness, damping: springDamping }}
                  onClick={() => setActive(i)}
                  {...dragProps}
                >
                  <div
                    className="h-full w-full"
                    style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}
                  >
                    {renderCard ? renderCard(item, { active: isActive }) : <DefaultFanCard item={item} />}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {showDots ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            {items.map((it, idx) => {
              const on = idx === active;
              return (
                <button
                  key={it.id}
                  onClick={() => setActive(idx)}
                  className={cn(
                    "h-2 w-2 rounded-full transition",
                    on ? "bg-ink" : "bg-ink/25 hover:bg-ink/45",
                  )}
                  aria-label={`Go to ${it.title}`}
                />
              );
            })}
          </div>
          {activeItem.href ? (
            <a
              href={activeItem.href}
              target="_blank"
              rel="noreferrer"
              className="text-ink/40 hover:text-forest transition"
              aria-label="Open link"
            >
              <SquareArrowOutUpRight className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DefaultFanCard({ item }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        {item.imageSrc ? (
          item.imageSrc.endsWith(".webm") ? (
            <video
              src={item.imageSrc}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={item.imageSrc}
              alt={item.title}
              className="h-full w-full object-cover"
              draggable={false}
              loading="eager"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink/5 font-mono text-xs text-ink/40">
            No preview yet
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />

      {item.tag ? (
        <div className="absolute top-4 left-4 z-10 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-[11px] tracking-wider text-brass backdrop-blur">
          {item.tag}
        </div>
      ) : null}

      <div className="relative z-10 flex h-full flex-col justify-end p-5">
        <div className="truncate font-display text-lg font-semibold text-white">{item.title}</div>
        {item.description ? (
          <div className="mt-1 line-clamp-2 text-sm text-white/80">{item.description}</div>
        ) : null}
      </div>
    </div>
  );
}

// ── shifted cards code ──

const isAnimCategory = (c = "") => /anim/i.test(c);
const isAICategory   = (c = "") => /ai\b|artificial|tool/i.test(c);
const isFontCategory = (c = "") => /font/i.test(c) || /type/i.test(c) || /typograph/i.test(c);
const isCodeCategory = (c = "") => /code/i.test(c) || /repo/i.test(c) || /git/i.test(c) || /dev/i.test(c);

// ── Shared detail drawer (modal) ──────────────────────────────────────────────
function DetailDrawer({ res, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(18,21,28,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl bg-paper border border-ink/10 overflow-hidden"
        style={{ boxShadow: "0 40px 80px -20px rgba(18,21,28,0.35)" }}
      >
        {res.preview_image && (
          <div className="w-full h-48 overflow-hidden">
            {res.preview_image.endsWith(".webm") ? (
              <video src={res.preview_image} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={res.preview_image} alt={res.title} className="w-full h-full object-cover" />
            )}
          </div>
        )}
        <div className="p-8">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-brass mb-2">
            {res.category}
          </p>
          <h2 className="font-display text-[26px] leading-[1.15] text-ink mb-3">{res.title}</h2>
          {res.description && (
            <p className="font-body text-[15px] leading-[1.7] text-ink/65 mb-6">{res.description}</p>
          )}
          <div className="flex items-center gap-3">
            <a
              href={res.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-ink text-paper px-5 py-2.5 font-body text-sm font-medium transition-transform hover:scale-[1.03]"
            >
              Visit <ArrowUpRight size={14} />
            </a>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 text-ink/60 px-5 py-2.5 font-body text-sm font-medium hover:border-ink/30 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink/30 hover:text-ink/70 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

// ── ANIMATIONS: Filmstrip ─────────────────────────────────────────────────────
function FilmstripCards({ items }) {
  const [active, setActive] = useState(null);
  return (
    <>
      {active && <DetailDrawer res={active} onClose={() => setActive(null)} />}
      <div className="relative select-none">
        {/* sprocket holes top */}
        <div className="flex overflow-hidden mb-1.5 pl-1 gap-1">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-5 h-2.5 rounded-sm border border-ink/12 bg-ink/5" />
          ))}
        </div>
        {/* scroll strip */}
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((res, i) => (
            <button
              key={res.id}
              onClick={() => setActive(res)}
              className="group relative flex-shrink-0 rounded-lg overflow-hidden border border-ink/12 bg-ink/4 hover:border-brass/40 transition-all duration-300"
              style={{ width: 220, height: 148 }}
            >
              {res.preview_image ? (
                res.preview_image.endsWith(".webm") ? (
                  <video src={res.preview_image} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={res.preview_image} alt={res.title} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-[13px] text-ink/20 italic p-4 text-center leading-snug">
                  {res.title}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-2 left-2 font-mono text-[10px] text-brass/70 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                <p className="font-body text-[12px] text-white font-medium leading-tight truncate">{res.title}</p>
              </div>
            </button>
          ))}
        </div>
        {/* sprocket holes bottom */}
        <div className="flex overflow-hidden mt-1.5 pl-1 gap-1">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-5 h-2.5 rounded-sm border border-ink/12 bg-ink/5" />
          ))}
        </div>
      </div>
    </>
  );
}

// ── AI TOOLS: Terminal / man-page ─────────────────────────────────────────────
function TerminalCards({ items }) {
  const [active, setActive] = useState(null);
  const [typed, setTyped] = useState({});

  useEffect(() => {
    const timers = [];
    items.forEach((res, idx) => {
      const delay = idx * 180;
      const label = `> ${res.title.toLowerCase().replace(/\s+/g, "-")}`;
      let i = 0;
      const t = setTimeout(() => {
        const interval = setInterval(() => {
          i++;
          setTyped((prev) => ({ ...prev, [res.id]: label.slice(0, i) }));
          if (i >= label.length) clearInterval(interval);
        }, 30);
        timers.push(interval);
      }, delay);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      {active && <DetailDrawer res={active} onClose={() => setActive(null)} />}
      <div className="rounded-xl border border-ink/15 overflow-hidden" style={{ background: "#0d1117" }}>
        {/* window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
          <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f56" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#ffbd2e" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#27c93f" }} />
          <span className="ml-3 font-mono text-[11px] tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
            vault — ai-tools
          </span>
        </div>
        <div className="p-5 flex flex-col gap-0.5">
          <div className="font-mono text-[11px] mb-3" style={{ color: "rgba(74,222,128,0.55)" }}>
            $ ls -la ./ai-tools/
          </div>
          {items.map((res, i) => (
            <button
              key={res.id}
              onClick={() => setActive(res)}
              className="group flex items-start gap-3 text-left rounded-md px-3 py-2.5 transition-all duration-150"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span className="font-mono text-[11px] mt-0.5 w-5 flex-shrink-0 tabular-nums" style={{ color: "rgba(74,222,128,0.4)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[13px] leading-none" style={{ color: "rgba(134,239,172,0.9)" }}>
                  {typed[res.id] || ""}
                  <span style={{ animation: "pulse 1s infinite", color: "rgba(74,222,128,0.7)" }}>▋</span>
                </div>
                {res.description && (
                  <p className="font-mono text-[11px] mt-1 leading-relaxed truncate" style={{ color: "rgba(255,255,255,0.25)" }}>
                    # {res.description}
                  </p>
                )}
              </div>
              <ChevronRight
                size={12}
                className="flex-shrink-0 mt-0.5 transition-colors"
                style={{ color: "rgba(255,255,255,0.15)" }}
              />
            </button>
          ))}
          <div className="font-mono text-[11px] mt-3 pt-3 border-t" style={{ color: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.06)" }}>
            {items.length} tool{items.length !== 1 ? "s" : ""} indexed. <span style={{ color: "rgba(74,222,128,0.5)" }}>●</span> vault online
          </div>
        </div>
      </div>
    </>
  );
}

// ── FONTS: Giant specimen display ─────────────────────────────────────────────
const PANGRAMS = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "Sphinx of black quartz, judge my vow.",
  "How vexingly quick daft zebras jump!",
  "Bright vixens jump; dozy fowl quack.",
];
const SIZES   = ["text-[56px]", "text-[40px]", "text-[34px]", "text-[48px]", "text-[44px]"];
const WEIGHTS = ["font-thin", "font-light", "font-normal", "font-medium", "font-bold", "font-black"];

function FontCards({ items }) {
  const [active, setActive] = useState(null);
  return (
    <>
      {active && <DetailDrawer res={active} onClose={() => setActive(null)} />}
      <div className="flex flex-col">
        {items.map((res, i) => (
          <button
            key={res.id}
            onClick={() => setActive(res)}
            className="group text-left py-7 px-2 border-b border-ink/8 last:border-b-0 hover:bg-white/40 transition-colors duration-200 rounded-xl -mx-2"
          >
            <div className="flex items-start justify-between gap-4 mb-1.5">
              <span className="font-mono text-[10px] tracking-widest text-brass/70 uppercase">
                {String(i + 1).padStart(2, "0")} — Typeface
              </span>
              <ArrowUpRight
                size={13}
                className="text-ink/20 group-hover:text-ink/55 mt-0.5 flex-shrink-0 transition-colors"
              />
            </div>
            <div
              className={`font-display ${SIZES[i % SIZES.length]} ${WEIGHTS[i % WEIGHTS.length]} leading-[1.05] text-ink tracking-tight mb-2.5 group-hover:text-forest transition-colors duration-200`}
            >
              {res.title}
            </div>
            <div className="font-body text-[13px] text-ink/28 leading-relaxed italic">
              {PANGRAMS[i % PANGRAMS.length]}
            </div>
            {res.description && (
              <p className="font-mono text-[11px] text-ink/35 mt-2 tracking-wide">
                ↳ {res.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

// ── CODE / REPOS: File tree ───────────────────────────────────────────────────
function guessType(title = "") {
  if (/react|next|vue|svelte|angular/i.test(title)) return { icon: "🟨", ext: ".jsx" };
  if (/python|django|flask|fast/i.test(title))      return { icon: "🐍", ext: ".py" };
  if (/golang|go\b/i.test(title))                   return { icon: "🐹", ext: ".go" };
  if (/rust|cargo/i.test(title))                    return { icon: "🦀", ext: ".rs" };
  if (/css|style|tailwind/i.test(title))            return { icon: "🎨", ext: ".css" };
  if (/type/i.test(title))                          return { icon: "🔷", ext: ".ts" };
  return { icon: "📁", ext: "" };
}

function CodeCards({ items }) {
  const [active, setActive] = useState(null);
  return (
    <>
      {active && <DetailDrawer res={active} onClose={() => setActive(null)} />}
      <div className="rounded-xl border border-ink/12 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-ink/8 bg-white/50">
          <span className="font-mono text-[11px] text-ink/35 tracking-wide">vault / code-repos</span>
          <span className="ml-auto font-mono text-[11px] text-ink/22">{items.length} items</span>
        </div>
        <div className="divide-y divide-ink/6 bg-white/25">
          {items.map((res) => {
            const { icon, ext } = guessType(res.title);
            return (
              <button
                key={res.id}
                onClick={() => setActive(res)}
                className="group w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/60 transition-colors duration-150"
              >
                <span className="text-base flex-shrink-0" role="img" aria-hidden="true">{icon}</span>
                <div className="flex-1 min-w-0 flex items-baseline gap-2">
                  <span className="font-mono text-[13px] text-ink/80 group-hover:text-forest transition-colors font-medium">
                    {res.title}{ext}
                  </span>
                  {res.description && (
                    <span className="font-body text-[12px] text-ink/32 truncate hidden sm:block max-w-xs">
                      — {res.description}
                    </span>
                  )}
                </div>
                <ChevronRight
                  size={13}
                  className="text-ink/18 group-hover:text-ink/55 flex-shrink-0 transition-colors"
                />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── FALLBACK: Editorial row list ──────────────────────────────────────────────
function EditorialCards({ items }) {
  const [active, setActive] = useState(null);
  return (
    <>
      {active && <DetailDrawer res={active} onClose={() => setActive(null)} />}
      <div className="flex flex-col">
        {items.map((res, i) => (
          <button
            key={res.id}
            onClick={() => setActive(res)}
            className="group flex items-center gap-[var(--s-4)] py-[var(--s-3)] border-b border-ink/8 last:border-b-0 text-left hover:bg-white/50 transition-colors -mx-2 px-2 rounded-lg"
          >
            <span className="font-mono text-[11px] text-brass/65 w-6 flex-shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-display text-[17px] text-ink/85 group-hover:text-ink transition-colors">
                {res.title}
              </span>
              {res.description && (
                <span className="font-body text-[13px] text-ink/38 ml-3">{res.description}</span>
              )}
            </div>
            <ArrowUpRight size={13} className="text-ink/20 group-hover:text-ink/55 flex-shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </>
  );
}

// ── Route to the right layout ─────────────────────────────────────────────────
export function CategoryCards({ category, items }) {
  if (isAnimCategory(category)) return <FilmstripCards items={items} />;
  if (isAICategory(category))   return <TerminalCards items={items} />;
  if (isFontCategory(category)) return <FontCards items={items} />;
  if (isCodeCategory(category)) return <CodeCards items={items} />;
  return <EditorialCards items={items} />;
}