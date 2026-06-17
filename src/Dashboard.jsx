import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import RequestForm from "./RequestForm";
import ReviewPanel from "./ReviewPanel";
import { CardStack, CategoryCards } from "./components/ui/card-stack";
import { Plus, LayoutGrid, ShieldCheck } from "lucide-react";

const isArcCategory  = (c = "") => /ui[\s\-/]*ux/i.test(c);

function useResponsiveCardSize() {
  const [size, setSize] = useState({ width: 480, height: 290 });
  useEffect(() => {
    function calc() {
      const vw = window.innerWidth;
      const width = Math.round(Math.min(480, Math.max(220, vw * 0.42)));
      setSize({ width, height: Math.round(width * (290 / 480)) });
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return size;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard({ userEmail, userId }) {
  const [resources, setResources]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [profile, setProfile]       = useState(null); // row from `users` (has is_admin, name)
  const [mode, setMode] = useState("index"); // "index" | "suggest" | "review"
  const cardSize = useResponsiveCardSize();

  useEffect(() => { fetchResources(); }, []);
  useEffect(() => { if (userId) fetchProfile(); }, [userId]);

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
  const userName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || userEmail : userEmail;

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

  // When a request gets approved while we're looking at the review panel,
  // the index is stale until we re-fetch — cheapest fix is just refetching
  // resources whenever we flip back to "index".
  const goToIndex = () => { setMode("index"); fetchResources(); };

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <div className="mx-auto max-w-[1200px] px-6 md:px-[var(--s-5)] py-[var(--s-6)]">

        <header className="flex items-center justify-between mb-[var(--s-6)]">
          <div>
            <p className="font-mono text-[12px] tracking-[0.18em] uppercase text-ink/40 mb-[var(--s-2)]">
              The Vault
            </p>
            <h1 className="font-display font-medium text-[32px] md:text-[40px] leading-[1.1]">
              Everything, sorted.
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && mode !== "review" && (
              <button
                onClick={() => setMode("review")}
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 text-ink/70 px-5 py-2.5 font-body text-sm font-medium transition-colors hover:border-ink/30"
              >
                <ShieldCheck size={15} />
                Review
              </button>
            )}

            <button
              onClick={() => (mode === "index" ? setMode("suggest") : goToIndex())}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-paper px-5 py-2.5 font-body text-sm font-medium transition-transform hover:scale-[1.03]"
            >
              {mode === "index" ? <Plus size={15} /> : <LayoutGrid size={15} />}
              {mode === "index" ? "Suggest Resource" : "View Index"}
            </button>
          </div>
        </header>

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
                    <CardStack
                      items={items.map((res, i) => ({
                        id: res.id,
                        title: res.title,
                        description: res.description,
                        imageSrc: res.preview_image,
                        href: res.url,
                        tag: String(i + 1).padStart(2, "0"),
                      }))}
                      cardWidth={cardSize.width}
                      cardHeight={cardSize.height}
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