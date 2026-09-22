import { useEffect, useState } from "react";
import "./Preloader.css";

/**
 * Minimalist Crypto Preloader Screen
 * Ultra-refined, lightweight, premium cryptographic prism glyph.
 * Zero heavy cubes, zero heavy circles, zero extra text.
 * Strictly centered with laser-sharp SVG path-tracing and prismatic shimmer.
 */
export default function Preloader({ onComplete }) {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Snappy, ultra-premium timing (~1.35s)
    const t1 = setTimeout(() => {
      setDone(true);
      if (onComplete) onComplete();
    }, 1350);

    const t2 = setTimeout(() => {
      setGone(true);
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (gone) return null;

  return (
    <div
      className={`crypto-preloader ${done ? "crypto-preloader-out" : ""}`}
      style={{ pointerEvents: done ? "none" : "auto" }}
      role="status"
      aria-label="Loading"
    >
      <div className="crypto-stage">
        {/* Soft, Weightless Chromatic Aura */}
        <div className="crypto-aura" />

        {/* Hairline Horizon Quantum Line */}
        <div className="crypto-horizon-line" />

        {/* Levitating Crypto Prism Glyph */}
        <div className="crypto-prism-wrap">
          <svg
            className="crypto-prism-svg"
            viewBox="0 0 80 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Left facet ambient glass fill */}
              <linearGradient id="crypto-facet-l" x1="14" y1="6" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
              </linearGradient>

              {/* Right facet ambient glass fill */}
              <linearGradient id="crypto-facet-r" x1="66" y1="6" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.03" />
              </linearGradient>

              {/* Lower facet ambient glass fill */}
              <linearGradient id="crypto-facet-b" x1="40" y1="48" x2="40" y2="88" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.08" />
                <stop offset="50%" stopColor="#f5b544" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </linearGradient>

              {/* Luminous Electric Laser Stroke Gradient */}
              <linearGradient id="crypto-laser-grad" x1="14" y1="6" x2="66" y2="88" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="45%" stopColor="#38bdf8" />
                <stop offset="75%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#f5b544" />
              </linearGradient>

              {/* Reverse Laser Stroke Gradient */}
              <linearGradient id="crypto-laser-rev-grad" x1="66" y1="6" x2="14" y2="88" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f5b544" />
                <stop offset="50%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            {/* ================= Upper Pyramid Canopy ================= */}
            {/* Left Facet Base */}
            <polygon
              points="40,6 14,44 40,38"
              fill="url(#crypto-facet-l)"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* Right Facet Base */}
            <polygon
              points="40,6 66,44 40,38"
              fill="url(#crypto-facet-r)"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* Upper Apex Ridge */}
            <line
              x1="40"
              y1="6"
              x2="40"
              y2="38"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1"
            />

            {/* Upper Flowing Laser Tracer */}
            <path
              d="M 40 6 L 14 44 L 40 38 L 66 44 Z"
              fill="none"
              stroke="url(#crypto-laser-grad)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="crypto-laser-stroke"
            />

            {/* ================= Lower Inverted Keel ================= */}
            {/* Lower Left Facet */}
            <polygon
              points="14,48 40,88 40,44"
              fill="url(#crypto-facet-b)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* Lower Right Facet */}
            <polygon
              points="66,48 40,88 40,44"
              fill="url(#crypto-facet-b)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* Lower Keel Ridge */}
            <line
              x1="40"
              y1="44"
              x2="40"
              y2="88"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
            />

            {/* Lower Counter Laser Tracer */}
            <path
              d="M 14 48 L 40 88 L 66 48 L 40 44 Z"
              fill="none"
              stroke="url(#crypto-laser-rev-grad)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="crypto-laser-stroke-rev"
            />

            {/* ================= Geometric Precision Vertex Anchors ================= */}
            <circle cx="40" cy="6" r="2" fill="#ffffff" />
            <circle cx="14" cy="44" r="1.5" fill="#00f0ff" />
            <circle cx="66" cy="44" r="1.5" fill="#c084fc" />
            <circle cx="40" cy="88" r="2" fill="#f5b544" />
          </svg>

          {/* Core Centroid Spark Floating at Horizon Midpoint */}
          <div className="crypto-centroid-spark" />
        </div>
      </div>
    </div>
  );
}
