import { useEffect, useState } from "react";
import AsteronLogo from "./AsteronLogo";

/**
 * Asteron Preloader Screen
 * Clean, unframed logo with celestial harmonic entrance animation
 * Exact colors matching the home page: "Aster" in primary text color, "on" in gold accent.
 * Strict zero-clutter: No extra loading bars, lines, spinners, or secondary texts.
 */
export default function Preloader({ onComplete }) {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setDone(true);
      if (onComplete) onComplete();
    }, 950);

    const t2 = setTimeout(() => {
      setGone(true);
    }, 1450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (gone) return null;

  return (
    <div
      className={`asteron-preloader ${done ? "asteron-preloader-out" : ""}`}
      style={{ pointerEvents: done ? "none" : "auto" }}
      role="status"
      aria-label="Asteron"
    >
      <div className="asteron-preloader-content">
        {/* Unframed Clean Logo with Celestial Harmonic Bloom Animation (No lighting effect) */}
        <div className="asteron-fx-stage">
          <div className="asteron-fx-logo-housing">
            <AsteronLogo size={96} glow={false} bright={false} />
          </div>
        </div>

        {/* Animated Asteron Brand Typography - Exact Home Page Colors */}
        <div className="asteron-preloader-brand-box">
          <span className="asteron-brand-char ast-char-a">A</span>
          <span className="asteron-brand-char ast-char-s">s</span>
          <span className="asteron-brand-char ast-char-t">t</span>
          <span className="asteron-brand-char ast-char-e">e</span>
          <span className="asteron-brand-char ast-char-r">r</span>
          <span className="asteron-brand-char ast-char-o brand-accent">o</span>
          <span className="asteron-brand-char ast-char-n brand-accent">n</span>
        </div>
      </div>
    </div>
  );
}
