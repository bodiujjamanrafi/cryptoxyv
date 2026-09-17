import { useState } from "react";
import { Link } from "react-router-dom";

export default function CryptoxyvPromoAd() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="cxv-ad-banner">
      {/* Background ambient lighting */}
      <div className="cxv-ad-ambient" />

      <div className="cxv-ad-container">
        {/* Left: Brand Badge & Visual Icon */}
        <div className="cxv-ad-brand">
          <div className="cxv-ad-icon-box">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="cxv-ad-svg">
              <polygon
                points="16,2 30,10 30,22 16,30 2,22 2,10"
                stroke="url(#ad-plasma-stroke)"
                strokeWidth="2.5"
                fill="url(#ad-plasma-fill)"
              />
              <circle cx="16" cy="16" r="4.5" fill="#22d3ee" />
              <defs>
                <linearGradient id="ad-plasma-stroke" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#6e8bff" />
                  <stop offset="100%" stopColor="#b66bff" />
                </linearGradient>
                <linearGradient id="ad-plasma-fill" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0.25)" />
                  <stop offset="100%" stopColor="rgba(182, 107, 255, 0.15)" />
                </linearGradient>
              </defs>
            </svg>
            <span className="cxv-ad-pulse-ring" />
          </div>

          <div className="cxv-ad-brand-text">
            <div className="cxv-ad-title-row">
              <span className="cxv-ad-brand-name">ASTERON</span>
              <span className="cxv-ad-badge-pro">PRO TERMINAL</span>
              <span className="cxv-ad-sponsored-tag">OFFICIAL</span>
            </div>
            <span className="cxv-ad-subline">Institutional-Grade Crypto Intelligence</span>
          </div>
        </div>

        {/* Center: Main Copy & Feature Pills */}
        <div className="cxv-ad-content">
          <p className="cxv-ad-headline">
            Trade with <strong>Zero-Latency WebSocket Feeds</strong>, Smart Contract Security Audits &amp; AI Sentiment Analytics.
          </p>
          <div className="cxv-ad-features">
            <span className="cxv-ad-feature-chip">
              <span className="cxv-ad-chip-dot green" /> Millisecond Orderbooks
            </span>
            <span className="cxv-ad-feature-chip">
              <span className="cxv-ad-chip-dot blue" /> Token Risk Scanner
            </span>
            <span className="cxv-ad-feature-chip">
              <span className="cxv-ad-chip-dot gold" /> VC Funding Radar
            </span>
          </div>
        </div>

        {/* Right: Call to Action & Dismiss Button */}
        <div className="cxv-ad-actions">
          <Link to="/login" className="cxv-ad-cta-btn">
            <span>Launch Terminal</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <button
            type="button"
            className="cxv-ad-close-btn"
            onClick={() => setDismissed(true)}
            title="Dismiss ad"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
