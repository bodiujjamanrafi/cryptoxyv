import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FUNDING_METRICS_SUMMARY,
  CATEGORIES_LIST,
  VC_FUNDS_DATA,
  FUNDING_DEALS_DATA,
} from "../api/fundraisingData";
import "./Fundraising.css";

// SVG Speedometer Gauge for Investment Activity
function ActivitySpeedometer({ value = 32 }) {
  const r = 32;
  const cx = 45;
  const cy = 42;
  const strokeWidth = 5;
  const circumference = Math.PI * r;
  const progressOffset = circumference - (value / 100) * circumference;

  return (
    <svg width="86" height="46" viewBox="0 0 90 46" fill="none">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Background Track */}
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Colored Active Arc */}
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={progressOffset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// SVG Mini Donut for Investment Focus
function MiniDonut({ slices = [] }) {
  const size = 52;
  const strokeWidth = 6.5;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => {
        const strokeDasharray = `${(slice.value / 100) * circumference} ${circumference}`;
        const strokeDashoffset = -((cumulativePercent / 100) * circumference);
        cumulativePercent += slice.value;

        return (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export default function Fundraising() {
  const [searchParams] = useSearchParams();
  const initialRoundParam = searchParams.get("round");

  const [activeTab, setActiveTab] = useState("funds"); // "funds" | "rounds" | "analytics"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRound, setSelectedRound] = useState(
    initialRoundParam
      ? FUNDING_DEALS_DATA.find((d) => d.id === initialRoundParam) || null
      : null
  );

  // Filtered VC Funds
  const filteredFunds = useMemo(() => {
    return VC_FUNDS_DATA.filter((fund) => {
      // Category filter
      const matchesCategory =
        selectedCategory === "All" ||
        fund.allCategories.includes(selectedCategory) ||
        fund.focusAreas.includes(selectedCategory);

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        fund.name.toLowerCase().includes(q) ||
        fund.tier.toLowerCase().includes(q) ||
        fund.latestDeal.project.toLowerCase().includes(q) ||
        fund.focusAreas.some((f) => f.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return FUNDING_DEALS_DATA.filter((deal) => {
      const matchesCategory =
        selectedCategory === "All" || deal.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        deal.name.toLowerCase().includes(q) ||
        deal.round.toLowerCase().includes(q) ||
        deal.leadInvestor.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="fundraising-page">
      <div className="container">
        {/* ========================================================================= */}
        {/* Breadcrumb Navigation                                                     */}
        {/* ========================================================================= */}
        <div className="fr-breadcrumb">
          <Link to="/">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Home
          </Link>
          <span className="fr-breadcrumb-sep">&gt;</span>
          <span className="fr-breadcrumb-curr">Fund Raising</span>
        </div>

        {/* ========================================================================= */}
        {/* Page Header                                                               */}
        {/* ========================================================================= */}
        <div className="fr-header">
          <h1 className="fr-title">Crypto Investments &amp; Fundraising Rounds</h1>
          <p className="fr-subtitle">
            The latest crypto VC investments — track every disclosed blockchain raise, the funds behind it, and how capital is rotating between categories.
          </p>

          <div className="fr-meta-row">
            <div className="fr-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span>Rounds tracked <strong>{FUNDING_METRICS_SUMMARY.displayRoundsTracked}</strong></span>
            </div>

            <div className="fr-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Funds <strong>{FUNDING_METRICS_SUMMARY.fundsCount}</strong></span>
            </div>

            <div className="fr-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                <line x1="12" y1="6" x2="12" y2="8" />
                <line x1="12" y1="16" x2="12" y2="18" />
              </svg>
              <span>Capital tracked <strong>{FUNDING_METRICS_SUMMARY.capitalTracked}</strong></span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Tab Navigation                                                            */}
        {/* ========================================================================= */}
        <div className="fr-tabs-bar">
          <button
            className={`fr-tab-btn ${activeTab === "funds" ? "active" : ""}`}
            onClick={() => setActiveTab("funds")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            Funds
          </button>

          <button
            className={`fr-tab-btn ${activeTab === "rounds" ? "active" : ""}`}
            onClick={() => setActiveTab("rounds")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
            Funding Rounds
          </button>

          <button
            className={`fr-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Analytics Dashboard
          </button>
        </div>

        {/* ========================================================================= */}
        {/* KPI Overview (3 Cards)                                                    */}
        {/* ========================================================================= */}
        <div className="fr-kpi-grid">
          {/* Card 1: Investment Activity */}
          <div className="fr-kpi-card">
            <div className="fr-kpi-info">
              <span className="fr-kpi-label">
                Investment Activity <span className="fr-kpi-info-icon" title={FUNDING_METRICS_SUMMARY.investmentActivity.description}>ⓘ</span>
              </span>
              <div className="fr-kpi-val">{FUNDING_METRICS_SUMMARY.investmentActivity.level}</div>
              <div className="fr-kpi-sub down mono">
                <span>↘</span> {FUNDING_METRICS_SUMMARY.investmentActivity.delta}%
              </div>
            </div>
            <div className="fr-gauge-wrap">
              <ActivitySpeedometer value={FUNDING_METRICS_SUMMARY.investmentActivity.gaugeValue} />
            </div>
          </div>

          {/* Card 2: Top Investors */}
          <div className="fr-kpi-card">
            <div className="fr-kpi-info">
              <span className="fr-kpi-label">
                Top Investors <span className="fr-kpi-info-icon" title="Most active lead investors in recent cycle">ⓘ</span>
              </span>
              <div className="fr-kpi-investors-block">
                <div className="fr-kpi-avatars-overlap">
                  {FUNDING_METRICS_SUMMARY.topInvestors.highlightAvatars.map((inv, idx) => (
                    <div
                      key={idx}
                      className="fr-kpi-avatar-circle"
                      style={{
                        backgroundColor: inv.bg,
                        color: inv.darkText ? "#000" : "#fff",
                        border: inv.border || "2px solid #0d1017",
                        zIndex: 10 - idx,
                      }}
                      title={inv.name}
                    >
                      {inv.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="fr-kpi-active-counter">
              <span className="fr-kpi-active-num mono">{FUNDING_METRICS_SUMMARY.topInvestors.activeCount}</span>
              <span className="fr-kpi-active-lbl">{FUNDING_METRICS_SUMMARY.topInvestors.label}</span>
            </div>
          </div>

          {/* Card 3: Investment Focus */}
          <div className="fr-kpi-card">
            <div className="fr-kpi-info">
              <span className="fr-kpi-label">
                Investment Focus <span className="fr-kpi-info-icon" title="Top sector share of deployed venture capital">ⓘ</span>
              </span>
              <div className="fr-kpi-val mono">{FUNDING_METRICS_SUMMARY.investmentFocus.percentage}</div>
              <div className="fr-kpi-sub tag">
                {FUNDING_METRICS_SUMMARY.investmentFocus.category}
              </div>
            </div>
            <div className="fr-donut-wrap">
              <MiniDonut slices={FUNDING_METRICS_SUMMARY.investmentFocus.slices} />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Search & Category Filter Bar                                              */}
        {/* ========================================================================= */}
        <div className="fr-filter-bar-card">
          <div className="fr-search-input-wrap">
            <svg className="fr-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="fr-search-input"
              placeholder="Search funds, focus, tier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="fr-category-row">
            <span className="fr-category-label">Category</span>
            {CATEGORIES_LIST.map((cat) => (
              <button
                key={cat}
                className={`fr-cat-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Tab 1 Content: Funds Table (Matching Reference Screenshot)                */}
        {/* ========================================================================= */}
        {activeTab === "funds" && (
          <div className="fr-table-wrap">
            <table className="fr-table">
              <thead>
                <tr>
                  <th style={{ width: "28%" }}># Name</th>
                  <th style={{ width: "12%" }}>Tier</th>
                  <th style={{ width: "18%" }}>Portfolio</th>
                  <th style={{ width: "18%" }}>Latest deal</th>
                  <th style={{ width: "12%" }}>Focus area</th>
                  <th className="th-roi" style={{ width: "12%" }}>Retail ROI</th>
                </tr>
              </thead>
              <tbody>
                {filteredFunds.map((fund) => (
                  <tr key={fund.id}>
                    {/* # Name */}
                    <td>
                      <div className="fr-col-name">
                        <span className="fr-rank-num mono">{fund.rank}</span>
                        <div
                          className="fr-fund-logo"
                          style={{ backgroundColor: fund.logoBg }}
                        >
                          {fund.logoText}
                        </div>
                        <div className="fr-fund-title-stack">
                          <span className="fr-fund-name">{fund.name}</span>
                          <span className="fr-fund-deals-sub mono">
                            {fund.dealsCount} deals · {fund.ledCount} led
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td>
                      <span className={`fr-tier-badge ${fund.tier.toLowerCase().replace(" ", "-")}`}>
                        {fund.tier}
                        {fund.isTopTier && <span className="fr-tier-crown">👑</span>}
                      </span>
                    </td>

                    {/* Portfolio */}
                    <td>
                      <div className="fr-portfolio-stack">
                        <div className="fr-portfolio-count">
                          <strong>{fund.portfolioCount}</strong> investments
                        </div>
                        <div className="fr-progress-track">
                          <div
                            className="fr-progress-bar"
                            style={{ width: `${fund.bookPercentage}%` }}
                          />
                        </div>
                        <span className="fr-portfolio-sub mono">
                          {fund.bookPercentage}% of largest book
                        </span>
                      </div>
                    </td>

                    {/* Latest Deal */}
                    <td>
                      <div className="fr-deal-stack">
                        <span className="fr-deal-name-amt">
                          {fund.latestDeal.project} · {fund.latestDeal.amount}
                        </span>
                        <span className="fr-deal-date mono">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {fund.latestDeal.date}
                        </span>
                      </div>
                    </td>

                    {/* Focus Area */}
                    <td>
                      <div className="fr-focus-area-list">
                        {fund.focusAreas.map((area, i) => (
                          <span key={i} className="fr-focus-pill">
                            {area}
                          </span>
                        ))}
                        {fund.plusFocus && (
                          <span className="fr-focus-pill plus">
                            {fund.plusFocus}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Retail ROI */}
                    <td>
                      <div className="fr-roi-stack">
                        <span className="fr-roi-val mono">{fund.retailRoi}</span>
                        <span className="fr-roi-multiple mono">{fund.multiple}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Tab 2 Content: Funding Rounds Table                                       */}
        {/* ========================================================================= */}
        {activeTab === "rounds" && (
          <div className="fr-table-wrap">
            <table className="fr-table fr-rounds-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Stage</th>
                  <th>Amount</th>
                  <th>Valuation</th>
                  <th>Lead Investor</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedRound(deal)}
                    title={`Click to view ${deal.name} deal breakdown`}
                  >
                    <td>
                      <span style={{ fontWeight: 700, color: "#ffffff", fontSize: "14.5px" }}>
                        {deal.name}
                      </span>
                    </td>
                    <td>
                      <span className="fr-stage-pill">{deal.round}</span>
                    </td>
                    <td>
                      <strong className="mono" style={{ color: "var(--cyan)", fontSize: "15px" }}>
                        {deal.amount}
                      </strong>
                    </td>
                    <td>
                      <span className="mono" style={{ color: "#cbd5e1" }}>
                        {deal.valuation}
                      </span>
                    </td>
                    <td>
                      <div className="fr-lead-tag">
                        <div
                          className="fr-fund-logo"
                          style={{
                            backgroundColor: deal.leadLogo,
                            width: "24px",
                            height: "24px",
                            fontSize: "10px",
                          }}
                        >
                          {deal.leadText}
                        </div>
                        {deal.leadInvestor}
                      </div>
                    </td>
                    <td>
                      <span className="fr-focus-pill">{deal.category}</span>
                    </td>
                    <td>
                      <span className="mono" style={{ color: "#64748b", fontSize: "12.5px" }}>
                        {deal.date}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="fr-status-live">
                        <span className="fr-status-dot" /> {deal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Tab 3 Content: Analytics Dashboard View                                   */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="fr-analytics-view">
            <div className="fr-analytics-grid">
              <div className="fr-analytics-card">
                <div className="fr-analytics-card-title">
                  <span>Capital Allocation by Sector</span>
                  <span className="mono" style={{ color: "var(--cyan)", fontSize: "13px" }}>$668M Total</span>
                </div>
                <div className="fr-cat-bars-list">
                  {FUNDING_METRICS_SUMMARY.investmentFocus.slices.map((slice, i) => (
                    <div key={i} className="fr-cat-bar-row">
                      <div className="fr-cat-bar-head">
                        <span>{slice.name}</span>
                        <strong className="mono">{slice.value}%</strong>
                      </div>
                      <div className="fr-progress-track">
                        <div
                          className="fr-progress-bar"
                          style={{
                            width: `${slice.value * 3.5}%`,
                            backgroundColor: slice.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fr-analytics-card">
                <div className="fr-analytics-card-title">
                  <span>Top VC Deployment Multiples</span>
                  <span className="mono" style={{ color: "#34d399", fontSize: "13px" }}>Avg 2.84x</span>
                </div>
                <div className="fr-cat-bars-list">
                  {VC_FUNDS_DATA.slice(0, 6).map((f) => (
                    <div key={f.id} className="fr-cat-bar-row">
                      <div className="fr-cat-bar-head">
                        <span>{f.name}</span>
                        <strong className="mono" style={{ color: "#34d399" }}>{f.multiple} ({f.retailRoi})</strong>
                      </div>
                      <div className="fr-progress-track">
                        <div
                          className="fr-progress-bar"
                          style={{
                            width: `${(parseFloat(f.multiple) / 5.2) * 100}%`,
                            backgroundColor: "#34d399",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Round Details Modal Dialog                                                */}
      {/* ========================================================================= */}
      {selectedRound && (
        <div className="fr-modal-backdrop" onClick={() => setSelectedRound(null)}>
          <div className="fr-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="fr-modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>
                  {selectedRound.name}
                </span>
                <span className="fr-stage-pill">{selectedRound.round}</span>
              </div>
              <button
                className="fr-modal-close-btn"
                onClick={() => setSelectedRound(null)}
              >
                ✕
              </button>
            </div>

            <div className="fr-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Raised Amount</span>
                  <div className="mono" style={{ fontSize: "22px", fontWeight: 700, color: "var(--cyan)", marginTop: "4px" }}>
                    {selectedRound.amount}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Valuation</span>
                  <div className="mono" style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
                    {selectedRound.valuation}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "#8da2bc", fontWeight: 600 }}>Overview &amp; Thesis</span>
                <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.6, marginTop: "6px" }}>
                  {selectedRound.description}
                </p>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "#8da2bc", fontWeight: 600 }}>Lead Investor</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                  <div
                    className="fr-fund-logo"
                    style={{ backgroundColor: selectedRound.leadLogo }}
                  >
                    {selectedRound.leadText}
                  </div>
                  <span style={{ fontWeight: 700, color: "#f8fafc", fontSize: "14px" }}>
                    {selectedRound.leadInvestor}
                  </span>
                </div>
              </div>

              {selectedRound.coInvestors && selectedRound.coInvestors.length > 0 && (
                <div>
                  <span style={{ fontSize: "12px", color: "#8da2bc", fontWeight: 600 }}>Syndicate Co-Investors</span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                    {selectedRound.coInvestors.map((co, i) => (
                      <span
                        key={i}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          padding: "5px 12px",
                          borderRadius: "8px",
                          fontSize: "12.5px",
                          color: "#e2e8f0",
                        }}
                      >
                        {co.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
