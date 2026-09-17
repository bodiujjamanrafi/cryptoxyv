import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { generateTokenAuditReport, SCAN_ENGINE_STEPS } from "../api/tokenScannerData";

export default function TokenScannerModal({ coin, onClose }) {
  const [scanning, setScanning] = useState(true);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [secAnalysisOpen, setSecAnalysisOpen] = useState(true);
  const [holdersOpen, setHoldersOpen] = useState(false);

  // Compute report synchronously so it is never null on first render
  const report = useMemo(() => {
    if (!coin) return null;
    return generateTokenAuditReport(coin);
  }, [coin]);

  const checkItems = useMemo(() => [
    {
      name: "Liquidity",
      hasInfo: true,
      cat: "Trading",
      desc: `Low liquidity of $2,156 detected. This may result in high slippage and price volatility.`,
      status: "warning",
    },
    {
      name: "Account State",
      hasInfo: true,
      cat: "Security",
      desc: "Account is properly initialized and ready for use.",
      status: "passed",
    },
    {
      name: "Transferable",
      hasInfo: false,
      cat: "Trading",
      desc: "Token can be freely transferred between wallets.",
      status: "passed",
    },
    {
      name: "Metadata Mutable",
      hasInfo: true,
      cat: "Transparency",
      desc: "Token metadata (name, symbol) cannot be changed.",
      status: "passed",
    },
    {
      name: "Mintable",
      hasInfo: false,
      cat: "Centralization",
      desc: "Token supply is fixed. New tokens cannot be created.",
      status: "passed",
    },
    {
      name: "Freezable",
      hasInfo: false,
      cat: "Centralization",
      desc: "Token accounts cannot be frozen, ensuring trading freedom.",
      status: "passed",
    },
    {
      name: "Closable",
      hasInfo: false,
      cat: "Centralization",
      desc: "Token program cannot be closed, ensuring long-term viability.",
      status: "passed",
    },
    {
      name: "Balance Mutable Authority",
      hasInfo: false,
      cat: "Centralization",
      desc: "Token balances cannot be modified by authority.",
      status: "passed",
    },
    {
      name: "Creator Malicious",
      hasInfo: false,
      cat: "Security",
      desc: "Creator malicious data not available",
      status: "neutral",
    },
    {
      name: "Transfer Hook",
      hasInfo: false,
      cat: "Security",
      desc: "Transfer hook data not available",
      status: "neutral",
    },
    {
      name: "Transfer Hook Malicious",
      hasInfo: false,
      cat: "Security",
      desc: "Transfer hook malicious data not available",
      status: "neutral",
    },
    {
      name: "Transfer Fee",
      hasInfo: false,
      cat: "Trading",
      desc: "Transfer fee data not available",
      status: "neutral",
    },
  ], []);

  // Lock background body scroll while modal is active
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  // Run the realistic scanning progress simulation whenever coin changes
  useEffect(() => {
    if (!coin) return;
    setScanning(true);
    setProgress(0);

    const startTime = Date.now();
    const duration = 2400; // 2.4s smooth realistic scan sequence

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(timer);
        // Once 100% is reached, short hold then transition to details
        setTimeout(() => {
          setScanning(false);
        }, 500);
      }
    }, 35);

    return () => clearInterval(timer);
  }, [coin]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Active step calculation based on current progress
  const activeStep = useMemo(() => {
    if (progress >= 100) return SCAN_ENGINE_STEPS[SCAN_ENGINE_STEPS.length - 1];
    for (let i = 0; i < SCAN_ENGINE_STEPS.length; i++) {
      if (progress < SCAN_ENGINE_STEPS[i].threshold) {
        return SCAN_ENGINE_STEPS[i];
      }
    }
    return SCAN_ENGINE_STEPS[SCAN_ENGINE_STEPS.length - 1];
  }, [progress]);

  const handleCopyAddress = () => {
    if (!report?.contractAddress) return;
    navigator.clipboard.writeText(report.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReScan = () => {
    setScanning(true);
    setProgress(0);
    const startTime = Date.now();
    const duration = 2600;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(timer);
        setTimeout(() => setScanning(false), 750);
      }
    }, 35);
  };

  if (!coin || !report) return null;

  // SVG parameters for score gauge
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = report ? circumference - (circumference * report.trustScore) / 100 : 0;

  return createPortal(
    <div className="scanner-fullpage-viewport">
      {/* ========================================================================= */}
      {/* 1. EXACT REFERENCE SCANNING UI (MATCHING SCREENSHOT)                       */}
      {/* ========================================================================= */}
      {scanning ? (
        <main className="ref-scanner-stage">
          {/* Subtle Top-Right Close Button */}
          <button
            className="ref-scanner-close-btn"
            onClick={onClose}
            title="Cancel scan and return"
            aria-label="Cancel scan"
          >
            ✕
          </button>

          {/* Central Circular Scanner Mechanism */}
          <div className="ref-scanner-orb-wrapper">
            {/* Horizontal Glowing Laser Beam animating up/down edge-to-edge across the orb */}
            <div className="ref-horizontal-laser-line" />

            {/* Outer dashed circular orbit with rotating cyan satellite dots */}
            <div className="ref-orbit-track">
              <span className="ref-satellite-dot dot-north" />
              <span className="ref-satellite-dot dot-east" />
              <span className="ref-satellite-dot dot-south" />
              <span className="ref-satellite-dot dot-west" />
            </div>

            {/* Middle glowing cyan neon ring */}
            <div className="ref-neon-ring" />

            {/* Inner dark circle with centered token logo */}
            <div className="ref-inner-token-disc">
              {coin.image ? (
                <img src={coin.image} alt={coin.name} className="ref-token-logo-img" />
              ) : (
                <div className="ref-token-logo-fallback mono">
                  {coin.symbol?.slice(0, 3) || "TK"}
                </div>
              )}
            </div>

            {/* Floating Security Key/Circuit Badge at ~4:30 o'clock position */}
            <div className="ref-key-badge" title="Verified Security Circuit">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Circuit key emblem */}
                <path
                  d="M7 15a4 4 0 1 0-3-6.83A4 4 0 0 0 7 15z"
                  stroke="#00e5ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="7" cy="11" r="1.5" fill="#00e5ff" />
                <path
                  d="M10.5 11.5L20 11.5M16 11.5V14.5M19 11.5V13.5"
                  stroke="#00e5ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Status Tracker: ◎ INITIALIZING SCAN */}
          <div className="ref-status-phase-row">
            <span className="ref-phase-icon">◎</span>
            <span className="ref-phase-title mono">
              {progress >= 100 ? "INITIALIZING SCAN" : (activeStep?.phase || "INITIALIZING SCAN")}
            </span>
          </div>

          {/* Headline: Scanning Ethereum */}
          <h1 className="ref-scanner-heading">
            Scanning <span className="ref-scanner-coin-highlight">{coin.name}</span>
          </h1>

          {/* Dynamic Subtitle */}
          <p className="ref-scanner-subtitle">
            {progress >= 100 ? "Finalizing security report ." : (activeStep?.sub || "Finalizing security report .")}
          </p>

          {/* Progress Bar Container */}
          <div className="ref-progress-container">
            <div className="ref-progress-meta-row">
              <span className="ref-progress-label mono">PROGRESS</span>
              <span className="ref-progress-percentage mono">{progress}%</span>
            </div>

            <div className="ref-progress-track">
              <div
                className="ref-progress-fill-bar"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 6 Diagnostic Steps List */}
            <div className="ref-steps-checklist">
              {SCAN_ENGINE_STEPS.map((stepItem, idx) => {
                const isCompleted = progress >= stepItem.threshold || progress === 100;
                const isRunning = !isCompleted && (idx === 0 || progress >= SCAN_ENGINE_STEPS[idx - 1].threshold);

                return (
                  <div
                    key={stepItem.id}
                    className={`ref-step-line ${isCompleted ? "completed" : isRunning ? "running" : "pending"}`}
                  >
                    <div className="ref-step-content-left">
                      <span className="ref-step-radio-icon">◎</span>
                      <span className="ref-step-number mono">[{stepItem.id}]</span>
                      <span className="ref-step-name">{stepItem.title}</span>
                    </div>

                    <div className="ref-step-content-right">
                      <span className="ref-step-ok-badge mono">
                        {isCompleted ? "OK" : isRunning ? "SCAN" : "WAIT"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Skip / View Report Button */}
            <div className="ref-skip-action-row">
              <button
                type="button"
                className="ref-skip-btn"
                onClick={() => setScanning(false)}
                title="Skip scanning animation and view report"
              >
                Skip to Full Report →
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* ========================================================================= */
        /* 2. REORGANIZED, COMPACT & PROFESSIONAL DETAILS PAGE                       */
        /* ========================================================================= */
        /* ========================================================================= */
        /* 2. SCAN DETAILS PAGE MATCHING 2ND REFERENCE IMAGE                         */
        /* ========================================================================= */
        <div className="scanner-details-view ref2-details-view">
          {/* Top Navigation Bar */}
          <header className="ref2-details-nav">
            <button className="ref2-nav-back-btn" onClick={onClose} title="Return to Market Overview">
              <span className="back-arrow">←</span>
              <span>Back</span>
            </button>

            <div className="ref2-nav-center">
              <span className="ref2-nav-scan-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <circle cx="12" cy="12" r="2" fill="#00e5ff" />
                </svg>
              </span>
              <span className="ref2-nav-scan-title">Token Security Scan</span>
            </div>

            <div className="ref2-nav-actions-right">
              <button
                type="button"
                className="ref2-rescan-btn"
                onClick={handleReScan}
                title="Re-run security scan"
              >
                ↻ Re-scan
              </button>
              <div className="ref2-nav-scanned-status hide-mobile-sm">
                <span className="ref2-status-dot" />
                <span>Scanned just now</span>
              </div>
              <button
                type="button"
                className="ref2-nav-close-icon-btn"
                onClick={onClose}
                title="Close"
                aria-label="Close report"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Main Details Body */}
          <main className="ref2-details-body">
            <div className="ref2-details-container">
              {/* Token Report Header */}
              <div className="ref2-token-report-header">
                <div className="ref2-token-avatar-wrap">
                  {coin.image ? (
                    <img src={coin.image} alt={coin.name} className="ref2-token-avatar" />
                  ) : (
                    <div className="ref2-token-avatar-fallback mono">
                      {coin.symbol?.slice(0, 2) || "TK"}
                    </div>
                  )}
                </div>
                <div className="ref2-token-title-block">
                  <span className="ref2-report-label mono">REPORT FOR</span>
                  <div className="ref2-token-name-row">
                    <h2 className="ref2-token-name">{coin.name}</h2>
                    <span className="ref2-token-symbol-pill mono">{coin.symbol?.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="ref2-main-grid">
                {/* Left Column (Main Analysis & Detailed Findings) */}
                <div className="ref2-left-col">
                  {/* Card 1: Trust Score */}
                  <div className="ref2-card ref2-trust-score-card">
                    <div className="ref2-trust-header-row">
                      <div className="ref2-card-title-group">
                        <div className="ref2-card-icon-box">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="ref2-card-heading">Trust Score</h3>
                          <span className="ref2-card-subheading">Comprehensive security assessment</span>
                        </div>
                      </div>

                      <div className="ref2-trust-number-box">
                        <span className="ref2-trust-percent mono">{report.trustScore}.0%</span>
                        <span className="ref2-trust-level-pill mono">HIGH</span>
                      </div>
                    </div>

                    {/* Glowing Gradient Progress Bar with Tick Marks */}
                    <div className="ref2-progress-track">
                      <div
                        className="ref2-progress-fill"
                        style={{ width: `${report.trustScore}%` }}
                      />
                    </div>
                    <div className="ref2-progress-ticks mono">
                      <span>0</span>
                      <span>25</span>
                      <span>50</span>
                      <span>75</span>
                      <span>100</span>
                    </div>

                    <div className="ref2-trust-footer-row">
                      <div className="ref2-security-level-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        <span>Security Level</span>
                      </div>
                      <span className="ref2-security-level-val safe">Excellent</span>
                    </div>
                  </div>

                  {/* Card 2: Scan Items (12 Checks) - Full View */}
                  <div className="ref2-card ref2-scan-items-card">
                    <div className="ref2-scan-items-header">
                      <div className="ref2-card-icon-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <div>
                        <div className="ref2-scan-title-row">
                          <h3 className="ref2-card-heading">Scan Items</h3>
                          <span className="ref2-checks-pill mono">12 CHECKS</span>
                        </div>
                        <span className="ref2-card-subheading">
                          Detailed breakdown of every security & integrity check
                        </span>
                      </div>
                    </div>

                    {/* 12 Checks Table */}
                    <div className="ref2-checks-table">
                      <div className="ref2-table-head">
                        <span className="th-item">ITEM</span>
                        <span className="th-cat">CATEGORY</span>
                        <span className="th-desc">DESCRIPTION</span>
                      </div>

                      <div className="ref2-table-body">
                        {checkItems.map((chk, idx) => (
                          <div key={idx} className="ref2-table-row">
                            <div className="td-item">
                              <span className={`ref2-dot dot-${chk.status}`} />
                              <span className="ref2-item-name">{chk.name}</span>
                              {chk.hasInfo && (
                                <span className="ref2-info-icon" title={chk.desc}>ⓘ</span>
                              )}
                            </div>

                            <div className="td-cat">
                              <span className={`ref2-cat-pill cat-${chk.cat.toLowerCase()}`}>
                                {chk.cat}
                              </span>
                            </div>

                            <div className="td-desc">
                              <span>{chk.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Token Restrictions & Compliance Disclaimer Box */}
                  <div className="ref2-card ref2-disclaimer-card">
                    <div className="ref2-disclaimer-header">
                      <div className="ref2-card-title-group">
                        <div className="ref2-card-icon-box">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#eab308"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div>
                          <div className="ref2-disclaimer-title-row">
                            <h3 className="ref2-card-heading">Token Restrictions & Disclaimer</h3>
                            <span className="ref2-disclaimer-pill mono">ACTIVE NOTICE</span>
                          </div>
                          <span className="ref2-card-subheading">
                            Jurisdictional compliance, trading boundaries & contract authority constraints
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ref2-disclaimer-content">
                      {/* Notice 1: Trading & Liquidity Restrictions */}
                      <div className="ref2-disclaimer-item warning">
                        <div className="ref2-disclaimer-item-header">
                          <span className="ref2-item-badge mono warning">LIQUIDITY & TRADING RESTRICTIONS</span>
                        </div>
                        <p className="ref2-disclaimer-text">
                          <strong>Low Pool Depth Alert:</strong> Heuristic telemetry detected limited decentralized liquidity of <strong>$2,156</strong> in active DEX pools. Trades with high volume may incur significant price slippage (&gt;4.5%) or partial routing execution. Always review swap impact before confirming.
                        </p>
                      </div>

                      {/* Notice 2: Smart Contract Authorities */}
                      <div className="ref2-disclaimer-item neutral">
                        <div className="ref2-disclaimer-item-header">
                          <span className="ref2-item-badge mono neutral">ON-CHAIN AUTHORITY STATUS</span>
                        </div>
                        <ul className="ref2-disclaimer-list">
                          <li>
                            <span className="bullet-dot safe" />
                            <span><strong>Mint Authority:</strong> Revoked — Total supply is capped. No new tokens can ever be minted or inflated by contract owners.</span>
                          </li>
                          <li>
                            <span className="bullet-dot safe" />
                            <span><strong>Freeze Authority:</strong> Revoked — User wallet addresses cannot be frozen, paused, or blacklisted.</span>
                          </li>
                          <li>
                            <span className="bullet-dot safe" />
                            <span><strong>Metadata Mutation:</strong> Immutable — Token name, symbol, and decimals cannot be altered.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Notice 3: Jurisdictional & Legal Disclaimer */}
                      <div className="ref2-disclaimer-item legal">
                        <div className="ref2-disclaimer-item-header">
                          <span className="ref2-item-badge mono legal">JURISDICTIONAL RESTRICTIONS & LEGAL DISCLAIMER</span>
                        </div>
                        <p className="ref2-disclaimer-text">
                          This token and its smart contract interactions may be restricted or prohibited in certain geographic jurisdictions, including sanctioned territories and regions subject to specific regulatory frameworks (e.g. OFAC, SEC/CFTC guidelines, and EU MiCA regulations). Users must verify compliance with local laws prior to transacting.
                        </p>
                        <p className="ref2-disclaimer-subtext">
                          <strong>Disclaimer:</strong> This automated scan provides real-time bytecode analysis and decentralized pool heuristics for informational purposes only. It does not constitute investment, financial, legal, or tax advice. Digital assets carry high market risk; always perform your own due diligence (DYOR).
                        </p>
                      </div>
                    </div>

                    {/* Footer Stamp */}
                    <div className="ref2-disclaimer-footer">
                      <div className="ref2-disclaimer-stamp">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                        <span className="mono">CyvGuard Automated Scanner v3.8 • Live Heuristic Verified</span>
                      </div>
                      <span className="ref2-disclaimer-tag mono">ISO-27001 Aligned</span>
                    </div>
                  </div>
                </div>

                {/* Right Column (Token Metrics & Sidebar Details) */}
                <div className="ref2-right-col">
                  {/* Card 1: Token Information */}
                  <div className="ref2-card ref2-sidebar-card">
                    <div className="ref2-card-title-group">
                      <div className="ref2-card-icon-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="6" cy="6" r="3" />
                          <circle cx="18" cy="18" r="3" />
                          <path d="M8.5 8.5l7 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="ref2-card-heading">Token Information</h3>
                        <span className="ref2-card-subheading">Contract details & metrics</span>
                      </div>
                    </div>

                    <div className="ref2-info-section-title">BASIC INFO</div>
                    <div className="ref2-info-list">
                      <div className="ref2-info-row">
                        <span className="ref2-info-key">Token Name</span>
                        <span className="ref2-info-val">{coin.name}</span>
                      </div>
                      <div className="ref2-info-row">
                        <span className="ref2-info-key">Token Symbol</span>
                        <span className="ref2-info-val mono">{coin.symbol?.toUpperCase()}</span>
                      </div>
                      <div className="ref2-info-row">
                        <span className="ref2-info-key">Token Address</span>
                        <span className="ref2-info-val mono addr" onClick={handleCopyAddress} title="Click to copy address">
                          {report.contractAddress ? `${report.contractAddress.slice(0, 6)}...${report.contractAddress.slice(-6)}` : "987654...87j1hg"}
                          <span className="copy-icon"> {copied ? "✓" : "⧉"}</span>
                        </span>
                      </div>
                      <div className="ref2-info-row">
                        <span className="ref2-info-key">Total Supply</span>
                        <span className="ref2-info-val mono">{report.totalSupply || report.circulatingSupply || "944.45M"}</span>
                      </div>
                      <div className="ref2-info-row">
                        <span className="ref2-info-key">Account State</span>
                        <span className="ref2-info-val safe">Initialized</span>
                      </div>
                    </div>

                    <div className="ref2-info-section-title" style={{ marginTop: 14 }}>TOKEN PROPERTIES</div>
                    <div className="ref2-info-list">
                      <div className="ref2-info-row">
                        <span className="ref2-info-key">Transferable</span>
                        <span className="ref2-info-val safe">Yes</span>
                      </div>
                      <div className="ref2-info-row">
                        <span className="ref2-info-key">Creator Address</span>
                        <span className="ref2-info-val">N/A</span>
                      </div>
                      <div className="ref2-info-row">
                        <span className="ref2-info-key">Transfer Hook</span>
                        <span className="ref2-info-val">None</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Security Analysis (collapsible) */}
                  <div className="ref2-card ref2-sidebar-card">
                    <div
                      className="ref2-collapsible-header"
                      onClick={() => setSecAnalysisOpen(!secAnalysisOpen)}
                    >
                      <div className="ref2-card-title-group">
                        <div className="ref2-card-icon-box">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="ref2-card-heading">Security Analysis</h3>
                          <span className="ref2-card-subheading">Security features & risk assessment</span>
                        </div>
                      </div>
                      <span className="ref2-toggle-arrow">{secAnalysisOpen ? "▲" : "▼"}</span>
                    </div>

                    {secAnalysisOpen && (
                      <div className="ref2-chips-grid">
                        <div className="ref2-chip">
                          <span className="chip-label">Account State</span>
                          <span className="chip-val safe">Initialized</span>
                        </div>
                        <div className="ref2-chip">
                          <span className="chip-label">Transferable</span>
                          <span className="chip-val safe">Yes</span>
                        </div>
                        <div className="ref2-chip">
                          <span className="chip-label">Metadata Mut...</span>
                          <span className="chip-val safe">Immutable</span>
                        </div>
                        <div className="ref2-chip">
                          <span className="chip-label">Mintable</span>
                          <span className="chip-val safe">Revoked</span>
                        </div>
                        <div className="ref2-chip">
                          <span className="chip-label">Freezable</span>
                          <span className="chip-val safe">Revoked</span>
                        </div>
                        <div className="ref2-chip">
                          <span className="chip-label">Closable</span>
                          <span className="chip-val safe">Revoked</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Top Holders (collapsible) */}
                  <div className="ref2-card ref2-sidebar-card">
                    <div
                      className="ref2-collapsible-header"
                      onClick={() => setHoldersOpen(!holdersOpen)}
                    >
                      <div className="ref2-card-title-group">
                        <div className="ref2-card-icon-box">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="ref2-card-heading">Top Holders</h3>
                          <span className="ref2-card-subheading">Token distribution & holder analysis</span>
                        </div>
                      </div>
                      <span className="ref2-toggle-arrow">{holdersOpen ? "▲" : "▼"}</span>
                    </div>

                    {holdersOpen && (
                      <div className="ref2-holders-list">
                        {report.topHolders.slice(0, 4).map((h) => (
                          <div key={h.rank} className="ref2-holder-item">
                            <div className="ref2-holder-left">
                              <span className="ref2-holder-rank mono">#{h.rank}</span>
                              <span className="ref2-holder-name">{h.entity}</span>
                            </div>
                            <span className="ref2-holder-share mono">{h.share}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card 4: Security Audit */}
                  <div className="ref2-card ref2-sidebar-card">
                    <div className="ref2-card-title-group">
                      <div className="ref2-card-icon-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="ref2-card-heading">Security Audit</h3>
                        <span className="ref2-card-subheading">Risk assessment & protection</span>
                      </div>
                    </div>

                    <p className="ref2-sidebar-desc">
                      No audit report found for <b>{coin.name}</b> token. If audited, submit report verification to update security badges.
                    </p>

                    <div className="ref2-audit-btn-row">
                      <button className="ref2-btn-contact" onClick={handleCopyAddress} title="Copy contract">
                        ✉ Contact Us
                      </button>
                      <button className="ref2-btn-get-audit" onClick={() => alert("Audit inquiry initiated")}>
                        Get Audit →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>,
    document.body
  );
}
