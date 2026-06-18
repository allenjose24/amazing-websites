import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import RequestForm from "./RequestForm";
import ReviewPanel from "./ReviewPanel";
import { CardStack, CategoryCards } from "./components/ui/card-stack";
import { Plus, LayoutGrid, ShieldCheck, X, Menu } from "lucide-react";

// UI/UX is sorted first — same helper used in card-stack
const isArcCategory = (c = "") => /ui[\s\-/]*ux/i.test(c);

function useResponsiveCardConfig() {
  const [config, setConfig] = useState({
    width: 480,
    height: 290,
    maxVisible: 7,
    overlap: 0.48,
    spreadDeg: 48,
  });
  useEffect(() => {
    function calc() {
      const vw = window.innerWidth;
      if (vw < 640) {
        // Mobile
        const width = Math.round(Math.min(480, Math.max(220, vw * 0.52)));
        setConfig({
          width,
          height: Math.round(width * (290 / 480)),
          maxVisible: 3, // fewer visible cards on mobile to prevent overflow
          overlap: 0.6,  // tighter overlap
          spreadDeg: 24, // narrower fan spread
        });
      } else {
        // Desktop / Tablet
        const width = Math.round(Math.min(480, Math.max(220, vw * 0.42)));
        setConfig({
          width,
          height: Math.round(width * (290 / 480)),
          maxVisible: 7,
          overlap: 0.48,
          spreadDeg: 48,
        });
      }
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return config;
}

export default function Dashboard({ userEmail, userId }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [profile, setProfile]     = useState(null);
  const [mode, setMode]           = useState("index"); // "index" | "suggest" | "review"
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const cardConfig = useResponsiveCardConfig();

  useEffect(() => { fetchResources(); }, []);
  useEffect(() => { if (userId) fetchProfile(); }, [userId]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function fetchResources() {
    setLoading(true);
    const { data, error } = await supabase.from("resources").select("*");
    if (error) console.error("Error fetching resources:", error);
    else setResources(data || []);
    setLoading(false);
  }

  async function fetchProfile() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) console.error("Error fetching profile:", error);
    else setProfile(data);
  }

  const isAdmin = profile?.is_admin === true;
  const userName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || userEmail
    : userEmail;

  const grouped = useMemo(() => {
    const map = new Map();
    resources.forEach((res) => {
      const key = res.category || "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(res);
    });
    return [...map.entries()].sort(([a], [b]) => {
      const aArc = isArcCategory(a) ? 0 : 1;
      const bArc = isArcCategory(b) ? 0 : 1;
      return aArc - bArc;
    });
  }, [resources]);

  const goToIndex = () => { setMode("index"); setMenuOpen(false); fetchResources(); };

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <div className="mx-auto max-w-[1200px] px-6 md:px-[var(--s-5)] pt-4 pb-[var(--s-6)]">

        {/* ── Floating Apple-Style Glassy Nav Bar ── */}
        <div className={`sticky top-4 z-40 bg-white/70 backdrop-blur-xl border border-ink/10 rounded-2xl shadow-[0_8px_32px_0_rgba(18,21,28,0.06)] transition-all duration-300 mb-[var(--s-5)] ${scrolled ? "py-2 px-6" : "py-4 px-6"}`}>
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className={`font-mono tracking-[0.18em] uppercase text-ink/40 transition-all duration-300 ${scrolled ? "opacity-0 h-0 overflow-hidden mb-0 text-[0px]" : "opacity-100 mb-1 text-[11px] sm:text-[12px]"}`}>
                The Vault
              </p>
              <h1 className={`font-display font-medium transition-all duration-300 leading-[1.1] ${scrolled ? "text-[18px] sm:text-[20px] md:text-[22px]" : "text-[24px] sm:text-[28px] md:text-[32px]"}`}>
                Everything, sorted.
              </h1>
            </div>

            {/* Desktop nav buttons */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              {isAdmin && mode !== "review" && (
                <button
                  onClick={() => setMode("review")}
                  className={`inline-flex items-center gap-2 rounded-full border border-ink/15 text-ink/70 font-body text-sm font-medium transition-all duration-300 hover:border-ink/30 ${scrolled ? "px-4 py-1.5" : "px-5 py-2.5"}`}
                >
                  <ShieldCheck size={15} />
                  <span className="hidden sm:inline">Review</span>
                </button>
              )}
              <button
                onClick={() => (mode === "index" ? setMode("suggest") : goToIndex())}
                className={`inline-flex items-center gap-2 rounded-full bg-ink text-paper font-body text-sm font-medium transition-all duration-300 hover:scale-[1.03] ${scrolled ? "px-4 py-1.5" : "px-5 py-2.5"}`}
              >
                {mode === "index" ? <Plus size={15} /> : <LayoutGrid size={15} />}
                <span className="hidden sm:inline">{mode === "index" ? "Suggest Resource" : "View Index"}</span>
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden flex-shrink-0 p-2 rounded-xl border border-ink/12 text-ink/60 hover:border-ink/25 transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </header>

          {/* Mobile nav drawer inside sticky bar */}
          {menuOpen && (
            <div className="sm:hidden mt-4 pt-4 border-t border-ink/10 flex flex-col gap-2">
              {isAdmin && mode !== "review" && (
                <button
                  onClick={() => { setMode("review"); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full rounded-xl border border-ink/15 text-ink/70 px-4 py-3 font-body text-sm font-medium transition-colors hover:border-ink/30"
                >
                  <ShieldCheck size={15} />
                  Review submissions
                </button>
              )}
              <button
                onClick={mode === "index" ? () => { setMode("suggest"); setMenuOpen(false); } : goToIndex}
                className="flex items-center gap-2 w-full rounded-xl bg-ink text-paper px-4 py-3 font-body text-sm font-medium"
              >
                {mode === "index" ? <Plus size={15} /> : <LayoutGrid size={15} />}
                {mode === "index" ? "Suggest a Resource" : "View Index"}
              </button>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {mode === "suggest" ? (
          <RequestForm userId={userId} userName={userName} />
        ) : mode === "review" ? (
          <ReviewPanel />
        ) : loading ? (
          <p className="font-mono text-sm text-ink/50">Loading vault…</p>
        ) : resources.length === 0 ? (
          <p className="font-mono text-sm text-ink/40">
            Nothing in the index yet. Suggest the first resource.
          </p>
        ) : (
          <div className="flex flex-col gap-[var(--s-7)]">
            {grouped.map(([category, items], catIndex) => {
              const isArc = isArcCategory(category);
              return (
                <section key={category}>
                  {/* Section header */}
                  <div className="flex items-baseline gap-[var(--s-3)] mb-[var(--s-4)] border-b border-ink/10 pb-[var(--s-3)]">
                    <span className="font-mono text-[13px] text-brass">
                      {String(catIndex + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-display text-[22px] text-ink/85">{category}</h2>
                    <span className="font-mono text-[12px] text-ink/30 ml-auto">
                      {items.length} {items.length === 1 ? "entry" : "entries"}
                    </span>
                  </div>

                  {isArc ? (
                    // UI/UX uses the arc fan CardStack
                    <CardStack
                      items={items.map((res, i) => ({
                        id: res.id,
                        title: res.title,
                        description: res.description,
                        imageSrc: res.preview_image,
                        href: res.url,
                        tag: String(i + 1).padStart(2, "0"),
                      }))}
                      cardWidth={cardConfig.width}
                      cardHeight={cardConfig.height}
                      maxVisible={cardConfig.maxVisible}
                      overlap={cardConfig.overlap}
                      spreadDeg={cardConfig.spreadDeg}
                      autoAdvance
                      intervalMs={3200}
                      pauseOnHover
                      showDots
                    />
                  ) : (
                    <CategoryCards category={category} items={items} />
                  )}
                </section>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}