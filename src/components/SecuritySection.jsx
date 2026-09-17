import { useState, useEffect, memo } from "react";
import {
  buildLiveAudits,
  buildLiveKyc,
  formatTimeAgo,
  subscribeSecurityStream,
} from "../api/securityData";

/* Premium gold "verified" seal matching the rest of the terminal */
function VerifiedSeal() {
  return (
    <svg className="verified" width="13" height="13" viewBox="0 0 24 24" fill="none" aria-label="verified">
      <path
        d="M12 2l2.2 1.6 2.7-.2 1 2.5 2.3 1.4-.6 2.6.9 2.5-2 1.8.1 2.7-2.6.8-1.6 2.2H12l-2.4.9-1.6-2.2-2.6-.8.1-2.7-2-1.8.9-2.5-.6-2.6 2.3-1.4 1-2.5 2.7.2L12 2z"
        fill="#f5b544"
      />
      <path d="M8.5 12.2l2.3 2.3 4.6-4.8" stroke="#0a0b14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
        stroke="#22d3ee"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#2bd9a6"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KycIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="#f5b544" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="2.5" stroke="#f5b544" strokeWidth="1.6" />
      <path d="M5 16.5c1.2-1.5 3-2 4-2s2.8.5 4 2" stroke="#f5b544" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 9h3M15 13h3M15 17h2" stroke="#6e8bff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* Fallback coin icon renderer so images never break */
function SafeLogo({ src, alt, symbol }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="sec-logo-fallback mono" aria-hidden="true">
        {symbol?.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      className="sec-item-logo"
      width="30"
      height="30"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

const AuditItem = memo(function AuditItem({ item }) {
  return (
    <div className={`sec-item ${item.isLive ? "sec-item-fresh" : ""}`}>
      {/* Top Row: Asset Identity + Recency & Direct Action */}
      <div className="sec-item-row sec-item-top-row">
        <div className="sec-project-info">
          <SafeLogo src={item.logo} alt={item.name} symbol={item.symbol} />
          <div className="sec-project-name-row">
            <span className="sec-name">{item.name}</span>
            <VerifiedSeal />
            <span className="sec-sym mono">{item.symbol}</span>
          </div>
        </div>

        <div className="sec-action-group">
          <span className="sec-time-stamp mono">
            {item.isLive && <span className="live-dot pulse" />}
            {item.timeAgo}
          </span>
          <a
            href={item.reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sec-btn-frameless sec-btn-audit"
            title={`View full audit report for ${item.name}`}
          >
            <span>Report</span>
            <span className="sec-btn-arrow">↗</span>
          </a>
        </div>
      </div>

      {/* Bottom Row: Security Credentials (Auditor Authority + Score Outcome) */}
      <div className="sec-item-row sec-item-cred-row">
        <div className="sec-authority">
          <span className="sec-bullet" style={{ background: item.auditorColor || "#22d3ee" }} />
          <span className="sec-authority-prefix">Audited by</span>
          <span className="sec-authority-name" style={{ color: item.auditorColor || "#e2e8f0" }}>
            {item.auditor}
          </span>
        </div>

        <div className="sec-outcome-group">
          <div className="sec-score-readout">
            <span className="sec-score-num mono">{item.score}</span>
            <span className="sec-score-denom mono">/100</span>
          </div>
          <span className="sec-outcome-badge sec-badge-passed">Passed</span>
        </div>
      </div>
    </div>
  );
});

const KycItem = memo(function KycItem({ item }) {
  const tierClean = (item.providerBadge || "").replace(" Verified", "").trim();

  return (
    <div className={`sec-item ${item.isLive ? "sec-item-fresh" : ""}`}>
      {/* Top Row: Asset Identity + Recency & Direct Action */}
      <div className="sec-item-row sec-item-top-row">
        <div className="sec-project-info">
          <SafeLogo src={item.logo} alt={item.name} symbol={item.symbol} />
          <div className="sec-project-name-row">
            <span className="sec-name">{item.name}</span>
            <VerifiedSeal />
            <span className="sec-sym mono">{item.symbol}</span>
          </div>
        </div>

        <div className="sec-action-group">
          <span className="sec-time-stamp mono">
            {item.isLive && <span className="live-dot pulse" />}
            {item.timeAgo}
          </span>
          <a
            href={item.certUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sec-btn-frameless sec-btn-kyc"
            title={`View KYC Certificate for ${item.name}`}
          >
            <span>Verify</span>
            <span className="sec-btn-arrow">↗</span>
          </a>
        </div>
      </div>

      {/* Bottom Row: Security Credentials (KYC Provider + Clearance Outcome) */}
      <div className="sec-item-row sec-item-cred-row">
        <div className="sec-authority">
          <span className="sec-bullet" style={{ background: "#f5b544" }} />
          <span className="sec-authority-prefix">Verified by</span>
          <span className="sec-authority-name sec-provider-color">
            {item.provider}
          </span>
        </div>

        <div className="sec-outcome-group">
          {tierClean && <span className="sec-tier-text mono">{tierClean}</span>}
          <span className="sec-outcome-badge sec-badge-cleared">
            <span className="sec-check-icon">✔</span> Cleared
          </span>
        </div>
      </div>
    </div>
  );
});

export default function SecuritySection({ coins = [] }) {
  const [audits, setAudits] = useState(() => buildLiveAudits(coins));
  const [kycs, setKycs] = useState(() => buildLiveKyc(coins));
  const [auditFilter, setAuditFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");

  // Re-sync with live market coins when available
  useEffect(() => {
    if (coins && coins.length > 0) {
      setAudits(buildLiveAudits(coins));
      setKycs(buildLiveKyc(coins));
    }
  }, [coins]);

  // Subscribe to real-time stream updates with deduplication
  useEffect(() => {
    const unsub = subscribeSecurityStream(
      coins,
      (newAudit) => {
        setAudits((prev) => [
          newAudit,
          ...prev.filter((p) => p.symbol.toLowerCase() !== newAudit.symbol.toLowerCase()).slice(0, 4),
        ]);
      },
      (newKyc) => {
        setKycs((prev) => [
          newKyc,
          ...prev.filter((p) => p.symbol.toLowerCase() !== newKyc.symbol.toLowerCase()).slice(0, 4),
        ]);
      }
    );
    return () => unsub();
  }, [coins]);

  const filteredAudits = audits.filter((a) => {
    if (auditFilter === "all") return true;
    return (
      a.auditor.toLowerCase().includes(auditFilter) ||
      a.chain.toLowerCase().includes(auditFilter) ||
      a.symbol.toLowerCase() === auditFilter
    );
  });

  const filteredKycs = kycs.filter((k) => {
    if (kycFilter === "all") return true;
    return (
      k.provider.toLowerCase().includes(kycFilter) ||
      k.providerBadge.toLowerCase().includes(kycFilter) ||
      k.chain.toLowerCase().includes(kycFilter)
    );
  });

  return (
    <section data-reveal className="section security-section" id="security">
      <div className="container">
        {/* Side-by-Side Staggered Terminal Grid */}
        <div className="security-grid">
          {/* ============ COLUMN 1: LATEST AUDITS (Upper) ============ */}
          <div className="sec-card glass sec-card-audits">
            <div className="sec-card-header">
              <div className="sec-card-title-group">
                <div className="sec-icon-wrap sec-icon-audit">
                  <ShieldIcon />
                </div>
                <div>
                  <h3 className="sec-card-title">Latest Audits</h3>
                  <p className="sec-card-sub">Smart contract security inspections</p>
                </div>
              </div>
              <div className="sec-filter-tabs" role="tablist">
                {["all", "certik", "openzeppelin", "hacken"].map((f) => (
                  <button
                    key={f}
                    className={`sec-tab-btn ${auditFilter === f ? "active" : ""}`}
                    onClick={() => setAuditFilter(f)}
                  >
                    {f === "all" ? "All" : f === "openzeppelin" ? "OpenZeppelin" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="sec-list">
              {filteredAudits.slice(0, 4).map((item) => (
                <AuditItem key={item.id} item={item} />
              ))}
            </div>

            <div className="sec-card-footer">
              <span className="sec-footer-stat mono">
                <b>14,280+</b> verified contracts
              </span>
              <span className="sec-providers-tag">CertiK · OpenZeppelin · Hacken · Halborn</span>
            </div>
          </div>

          {/* ============ COLUMN 2: LATEST KYC (Slightly Lower Offset) ============ */}
          <div className="sec-card glass sec-card-kyc">
            <div className="sec-card-header">
              <div className="sec-card-title-group">
                <div className="sec-icon-wrap sec-icon-kyc">
                  <KycIcon />
                </div>
                <div>
                  <h3 className="sec-card-title">Latest KYC</h3>
                  <p className="sec-card-sub">Executive &amp; founder clearances</p>
                </div>
              </div>
              <div className="sec-filter-tabs" role="tablist">
                {["all", "assure", "solidproof", "vital"].map((f) => (
                  <button
                    key={f}
                    className={`sec-tab-btn ${kycFilter === f ? "active" : ""}`}
                    onClick={() => setKycFilter(f)}
                  >
                    {f === "all" ? "All" : f === "assure" ? "Assure DeFi" : f === "solidproof" ? "SolidProof" : "Vital Block"}
                  </button>
                ))}
              </div>
            </div>

            <div className="sec-list">
              {filteredKycs.slice(0, 4).map((item) => (
                <KycItem key={item.id} item={item} />
              ))}
            </div>

            <div className="sec-card-footer">
              <span className="sec-footer-stat mono">
                <b>9,420+</b> cleared founding teams
              </span>
              <span className="sec-providers-tag">Assure DeFi · SolidProof · Vital Block · Coinsult</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
