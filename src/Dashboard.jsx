import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import AdminPanel from "./AdminPanel";
import { CardStack } from "./components/ui/card-stack";
import { Plus, LayoutGrid } from "lucide-react";

// Matches "UI-UX Websites", "UI / UX Design", "UI/UX", etc.
// Adjust this if your actual category strings differ.
const isArcCategory = (category = "") => /ui[\s\-/]*ux/i.test(category);

function useResponsiveCardSize() {
  const [size, setSize] = useState({ width: 480, height: 290 });

  useEffect(() => {
    function calc() {
      const vw = window.innerWidth;
      const width = Math.round(Math.min(480, Math.max(220, vw * 0.42)));
      const height = Math.round(width * (290 / 480));
      setSize({ width, height });
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return size;
}

export default function Dashboard({ userEmail }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const cardSize = useResponsiveCardSize();

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    setLoading(true);
    const { data, error } = await supabase.from("resources").select("*");
    if (error) console.error("Error fetching resources:", error);
    else setResources(data || []);
    setLoading(false);
  }

  const grouped = useMemo(() => {
    const map = new Map();
    resources.forEach((res) => {
      const key = res.category || "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(res);
    });
    // surface the arc category first since it's the showcase
    return [...map.entries()].sort(([a], [b]) => {
      const aArc = isArcCategory(a) ? 0 : 1;
      const bArc = isArcCategory(b) ? 0 : 1;
      return aArc - bArc;
    });
  }, [resources]);

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
          <button
            onClick={() => setIsAdminMode((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-paper px-5 py-2.5 font-body text-sm font-medium transition-transform hover:scale-[1.03]"
          >
            {isAdminMode ? <LayoutGrid size={15} /> : <Plus size={15} />}
            {isAdminMode ? "View Index" : "Add Resource"}
          </button>
        </header>

        {isAdminMode ? (
          <AdminPanel userEmail={userEmail} />
        ) : loading ? (
          <p className="font-mono text-sm text-ink/50">Loading vault…</p>
        ) : resources.length === 0 ? (
          <p className="font-mono text-sm text-ink/40">
            Nothing in the index yet. Add your first resource.
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--s-4)]">
                      {items.map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group block rounded-2xl border border-ink/10 bg-white/60 p-[var(--s-4)] transition-all hover:border-ink/20 hover:shadow-[0_20px_40px_-16px_rgba(18,21,28,0.15)]"
                        >
                          <h3 className="font-display text-[18px] text-ink/90 mb-1">{res.title}</h3>
                          {res.description ? (
                            <p className="text-sm text-ink/60 leading-relaxed line-clamp-2">
                              {res.description}
                            </p>
                          ) : null}
                        </a>
                      ))}
                    </div>
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