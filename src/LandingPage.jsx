import { useEffect, useRef } from "react";
import { GooeyText } from "./components/ui/gooey-text-morphing";
import { ArrowUpRight } from "lucide-react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4";
const SENSITIVITY = 0.8;

export default function LandingPage({ onLogin }) {
  const videoRef = useRef(null);
  const prevXRef = useRef(null);
  const targetTimeRef = useRef(0);
  const seekingRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMouseMove = (e) => {
      const video = videoRef.current;
      if (!video || !video.duration) return;

      const currentX = e.clientX;
      if (prevXRef.current === null) {
        prevXRef.current = currentX;
        return;
      }

      const delta = currentX - prevXRef.current;
      prevXRef.current = currentX;

      const offset = (delta / window.innerWidth) * SENSITIVITY * video.duration;
      targetTimeRef.current = Math.min(
        video.duration,
        Math.max(0, targetTimeRef.current + offset)
      );

      if (!seekingRef.current) {
        seekingRef.current = true;
        video.currentTime = targetTimeRef.current;
      }
    };

    const handleSeeked = () => {
      const video = videoRef.current;
      if (!video) return;
      if (Math.abs(video.currentTime - targetTimeRef.current) > 0.01) {
        video.currentTime = targetTimeRef.current;
      } else {
        seekingRef.current = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, []);

  return (
    <>
      {/* full-screen video background */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        preload="auto"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "70% center",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* subtle veil so text stays readable */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(120deg, rgba(245,245,241,0.55) 0%, rgba(245,245,241,0.20) 60%, rgba(245,245,241,0.05) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* main layout: single screen, no overflow */}
      <div
        className="text-ink font-body"
        style={{
          position: "relative",
          zIndex: 2,
          overflow: "hidden",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          className="mx-auto w-full px-6 md:px-[var(--s-5)]"
          style={{ maxWidth: 1200 }}
        >
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

          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontWeight: 500,
              fontSize: "clamp(28px, 5vw, 42px)",
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
              fontSize: "clamp(28px, 5vw, 42px)",
              lineHeight: 1.1,
              color: "rgba(18,21,28,0.85)",
              margin: "0 0 var(--s-4) 0",
            }}
          >
            worth returning to.
          </h1>

          <p
            style={{
              fontFamily: "var(--font-body, sans-serif)",
              fontSize: "clamp(15px, 2vw, 18px)",
              lineHeight: 1.6,
              color: "rgba(18,21,28,0.65)",
              maxWidth: 460,
              margin: "0 0 var(--s-4) 0",
            }}
          >
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
      </div>
    </>
  );
}