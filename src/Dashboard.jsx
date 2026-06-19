import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import RequestForm from "./RequestForm";
import ReviewPanel from "./ReviewPanel";
import { CardStack, CategoryCards } from "./components/ui/card-stack";
import { GitPullRequest, LayoutGrid, ShieldCheck, X, Menu, LogOut, RotateCw } from "lucide-react";

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
          target: "mobile",
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
          target: "desktop",
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshing, setRefreshing]         = useState(false);
  const cardConfig = useResponsiveCardConfig();

  useEffect(() => { fetchResources(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    await fetchResources(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Error signing out:", error.message);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [scrolled]);

  const fetchProfile = useCallback(async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) console.error("Error fetching profile:", error);
    else setProfile(data);
  }, [userId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (userId) fetchProfile(); }, [userId, fetchProfile]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function fetchResources(silent = false) {
    if (!silent) setLoading(true);
    const { data, error } = await supabase.from("resources").select("*");
    if (error) console.error("Error fetching resources:", error);
    else setResources(data || []);
    if (!silent) setLoading(false);
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

        {/* ── Static Apple-Style Glassy Nav Bar (Scrolls with page) ── */}
        <div className="relative bg-white/70 backdrop-blur-xl border border-ink/10 rounded-2xl shadow-[0_8px_32px_0_rgba(18,21,28,0.06)] p-6 mb-[var(--s-5)]">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono tracking-[0.18em] uppercase text-ink/40 mb-1 text-[11px] sm:text-[12px]">
                The Vault
              </p>
              <h1 className="font-display font-medium leading-[1.1] text-[24px] sm:text-[28px] md:text-[32px]">
                Everything, sorted.
              </h1>
            </div>

            {/* Desktop-only: Full controls when NOT scrolled */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRefresh}
                title="Refresh Data"
                className="inline-flex items-center justify-center rounded-full border border-ink/15 text-ink/70 hover:border-ink/30 hover:bg-ink/5 transition-all w-10 h-10 cursor-pointer"
              >
                <RotateCw size={15} className={refreshing ? "animate-spin" : ""} />
              </button>
              {isAdmin && mode !== "review" && (
                <button
                  onClick={() => setMode("review")}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 text-ink/70 font-body text-sm font-medium transition-all duration-300 hover:border-ink/30 px-5 py-2.5"
                >
                  <ShieldCheck size={15} />
                  <span className="hidden sm:inline">Review</span>
                </button>
              )}
              <button
                onClick={() => (mode === "index" ? setMode("suggest") : goToIndex())}
                className="inline-flex items-center gap-2 rounded-full bg-ink text-paper font-body text-sm font-medium transition-all duration-300 hover:scale-[1.03] px-5 py-2.5"
              >
                {mode === "index" ? <GitPullRequest size={15} /> : <LayoutGrid size={15} />}
                <span className="hidden sm:inline">{mode === "index" ? "Contribute" : "View Index"}</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 text-ink/70 font-body text-sm font-medium transition-all duration-300 hover:border-burgundy/30 hover:text-burgundy hover:bg-burgundy/5 px-5 py-2.5"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>

            {/* Mobile-only: Suggest + Hamburger */}
            <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRefresh}
                title="Refresh Data"
                className="flex items-center justify-center rounded-full border border-ink/12 text-ink/60 hover:border-ink/25 hover:bg-ink/5 transition-all w-10 h-10 cursor-pointer"
              >
                <RotateCw size={14} className={refreshing ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => (mode === "index" ? setMode("suggest") : goToIndex())}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper font-body font-medium transition-all duration-300 hover:scale-[1.03] text-xs px-4 py-2"
              >
                {mode === "index" ? <GitPullRequest size={14} /> : <LayoutGrid size={14} />}
                <span>{mode === "index" ? "Contribute" : "Index"}</span>
              </button>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center justify-center rounded-full border border-ink/12 text-ink/60 hover:border-ink/25 hover:bg-ink/5 transition-all w-10 h-10"
                aria-label="Menu"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </header>

          {/* Mobile nav drawer inside static header */}
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
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full rounded-xl border border-ink/15 text-ink/70 px-4 py-3 font-body text-sm font-medium transition-colors hover:border-burgundy/30 hover:text-burgundy hover:bg-burgundy/5"
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* ── Floating Capsule Controls (Fixed when scrolled) ── */}
        <div className={`fixed top-4 right-6 z-50 bg-white/85 backdrop-blur-xl border border-ink/10 rounded-full shadow-[0_8px_32px_0_rgba(18,21,28,0.08)] p-1.5 flex items-center gap-2 transition-all duration-300 ease-in-out ${
          scrolled ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
        }`}>
          <button
            onClick={handleRefresh}
            title="Refresh Data"
            className="flex items-center justify-center rounded-full border border-ink/12 text-ink/60 hover:border-ink/25 hover:bg-ink/5 transition-all w-8 h-8 cursor-pointer"
          >
            <RotateCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => (mode === "index" ? setMode("suggest") : goToIndex())}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper font-body font-medium transition-all duration-300 hover:scale-[1.03] text-xs px-3.5 py-1.5 sm:text-sm sm:px-4 sm:py-1.5"
          >
            {mode === "index" ? <GitPullRequest size={14} /> : <LayoutGrid size={14} />}
            <span className="hidden sm:inline">{mode === "index" ? "Contribute" : "View Index"}</span>
            <span className="sm:hidden">{mode === "index" ? "Contribute" : "Index"}</span>
          </button>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center justify-center rounded-full border border-ink/12 text-ink/60 hover:border-ink/25 hover:bg-ink/5 transition-all w-8 h-8"
            aria-label="Menu"
          >
            {menuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>

          {/* Floating Dropdown Menu (relative to the capsule) */}
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white/95 backdrop-blur-xl border border-ink/10 rounded-xl shadow-[0_8px_32px_0_rgba(18,21,28,0.06)] p-1.5 z-50 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
              {isAdmin && mode !== "review" && (
                <button
                  onClick={() => { setMode("review"); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full text-left rounded-lg text-ink/70 hover:bg-ink/5 px-3 py-2 font-body text-sm font-medium transition-colors"
                >
                  <ShieldCheck size={15} />
                  Review submissions
                </button>
              )}
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full text-left rounded-lg text-ink/70 hover:text-burgundy hover:bg-burgundy/5 px-3 py-2 font-body text-sm font-medium transition-colors"
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {mode === "suggest" ? (
          <RequestForm userId={userId} userName={userName} refreshTrigger={refreshTrigger} />
        ) : mode === "review" ? (
          <ReviewPanel refreshTrigger={refreshTrigger} />
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