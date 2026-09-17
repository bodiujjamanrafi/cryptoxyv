import { useState } from "react";
import { getCoinInsights } from "../api/coinNews";

export default function CoinGeckoRightRail({ coin }) {
  const [activeTab, setActiveTab] = useState("insights"); // 'insights' | 'portfolio'
  const sym = (coin?.symbol || "BTC").toUpperCase();

  const { movingCard, todayEvents, yesterdayEvents } = getCoinInsights(coin);

  return (
    <aside className="cg-right-rail">
      {/* 1. Insights Header */}
      <div className="cg-insights-header">
        <div className="cg-insights-tabs">
          <button
            type="button"
            className={`cg-insights-tab ${activeTab === "insights" ? "active" : ""}`}
            onClick={() => setActiveTab("insights")}
          >
            <span className="cg-sparkle">✦</span>
            <span>Insights</span>
          </button>
          <button
            type="button"
            className={`cg-insights-tab ${activeTab === "portfolio" ? "active" : ""}`}
            onClick={() => setActiveTab("portfolio")}
          >
            Portfolio
          </button>
        </div>
        <div className="cg-insights-actions">
          <button type="button" className="cg-icon-btn" title="Share Insights">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
          <button type="button" className="cg-icon-btn" title="Settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>
      </div>

      {activeTab === "portfolio" ? (
        <div className="cg-portfolio-pane">
          <p className="text-muted" style={{ fontSize: 13, padding: "20px 0" }}>
            Track your {sym} transactions, PnL, and cost basis in real-time.
          </p>
          <button type="button" className="btn btn-primary" style={{ width: "100%" }}>
            + Add {sym} Transaction
          </button>
        </div>
      ) : (
        <div className="cg-insights-body">
          {/* 2. Why [COIN] is moving */}
          <div className="cg-moving-card">
            <div className="cg-moving-badge">
              <span className="cg-dot-pulse" />
              <span>Why {sym} is moving</span>
            </div>
            <h4 className="cg-moving-headline">
              {movingCard.headline}
            </h4>
            <div className="cg-moving-meta">
              <span className="cg-sources-pill">
                <span className="cg-source-dots">●●</span> {movingCard.sources} sources
              </span>
              <span className="cg-moving-time">{movingCard.timeAgo}</span>
            </div>
          </div>

          {/* 3. Recently Happened to [COIN] Timeline */}
          <div className="cg-timeline-section">
            <div className="cg-timeline-head">
              <span>Recently Happened to {sym}</span>
            </div>

            {/* Today */}
            <div className="cg-timeline-group">
              <span className="cg-group-label">Today</span>
              <div className="cg-events-list">
                {todayEvents.map((e) => (
                  <div className="cg-event-item" key={e.id}>
                    <span className="cg-event-time-ago">{e.timeAgo}</span>
                    <h5 className="cg-event-title">{e.title}</h5>
                    <div className="cg-event-footer">
                      <span className="cg-sources-pill small">
                        <span className="cg-source-dots">●</span> {e.sources} source{e.sources > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Yesterday */}
            <div className="cg-timeline-group">
              <span className="cg-group-label">Yesterday</span>
              <div className="cg-events-list">
                {yesterdayEvents.map((e) => (
                  <div className="cg-event-item" key={e.id}>
                    <h5 className="cg-event-title">{e.title}</h5>
                    <div className="cg-event-footer">
                      <span className="cg-sources-pill small">
                        <span className="cg-source-dots">●</span> {e.sources} source{e.sources > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
