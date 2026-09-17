export default function AsteronLogo({
  size = 30,
  showText = false,
  className = "",
  glow = true,
  bright = false,
}) {
  return (
    <div
      className={`asteron-logo-wrap ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="asteron-logo-svg"
        style={{
          flexShrink: 0,
          overflow: "visible",
          filter: glow
            ? bright
              ? "drop-shadow(0 0 10px rgba(0, 240, 255, 0.6)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.35))"
              : "drop-shadow(0 0 7px rgba(0, 240, 255, 0.4)) drop-shadow(0 0 14px rgba(129, 140, 248, 0.2))"
            : undefined,
        }}
        aria-hidden="true"
      >
        <defs>
          {/* Luminous cyan-to-electric blue ascent gradient */}
          <linearGradient id="ast-blade-l" x1="7" y1="29" x2="18" y2="4.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Luminous electric blue-to-violet descent gradient */}
          <linearGradient id="ast-blade-r" x1="29" y1="29" x2="18" y2="4.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Transparent orbital horizon ring gradient */}
          <linearGradient id="ast-orbit-sweep" x1="4" y1="20" x2="32" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.15" />
            <stop offset="30%" stopColor="#00f0ff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#a855f7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.15" />
          </linearGradient>

          {/* Core micro-star radiant gradient */}
          <radialGradient id="ast-spark-core" cx="18" cy="16.5" r="3" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Back portion of the celestial orbit ring (passes behind the delta) */}
        <path
          d="M 5.8 22.8 C 4.5 19.8 8.8 17.2 16.5 16.6 C 24.2 16.0 30.5 17.8 31.2 20.2"
          stroke="url(#ast-orbit-sweep)"
          strokeWidth="1.1"
          strokeDasharray="2.5 1.5"
          opacity="0.55"
        />

        {/* Left Tapered Ascent Blade (Transparent Geometric Facet) */}
        <polygon
          points="18,4.5 7.5,29 11.8,29 18,13.2"
          stroke="url(#ast-blade-l)"
          strokeWidth="1.25"
          strokeLinejoin="round"
          fill="rgba(0, 240, 255, 0.04)"
        />

        {/* Right Tapered Descent Blade (Transparent Geometric Facet) */}
        <polygon
          points="18,4.5 28.5,29 24.2,29 18,13.2"
          stroke="url(#ast-blade-r)"
          strokeWidth="1.25"
          strokeLinejoin="round"
          fill="rgba(168, 85, 247, 0.04)"
        />

        {/* Front portion of the luminous celestial orbit ring (sweeps across front) */}
        <path
          d="M 5.2 22.2 C 5.8 24.8 12.2 26.2 19.8 25.6 C 26.8 25.0 31.8 22.8 31.2 20.2"
          stroke="url(#ast-orbit-sweep)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* Orbital Trajectory Vector Points (Hairline Light Nodes) */}
        <circle cx="6" cy="22.5" r="1.1" fill="#00f0ff" />
        <circle cx="30.8" cy="20.4" r="1.1" fill="#c084fc" />

        {/* Central Floating Celestial Spark (Airy & Radiant) */}
        <circle cx="18" cy="16.5" r="3.2" fill="url(#ast-spark-core)" />
        <circle cx="18" cy="16.5" r="1.2" fill="#ffffff" />

        {/* Apex Luminous Pinnacle Node */}
        <circle cx="18" cy="4.5" r="1.3" fill="#ffffff" />
      </svg>

      {showText && (
        <span className="brand-name">
          Aster<span className="brand-accent">on</span>
        </span>
      )}
    </div>
  );
}
