import { useState, useMemo, useRef, useEffect } from "react";
import { fmtPrice, fmtPct, fmtCompact } from "../api/coingecko";
import PromoVideoBanner from "./PromoVideoBanner";

const TIMEFRAMES = [
  { label: "24H", days: 1 },
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "YTD", days: 250 },
  { label: "1Y", days: 365 },
  { label: "Max", days: 1825 },
];

export default function CoinGeckoChartArea({
  coin,
  currentPrice,
  points,
  days,
  onSelectDays,
  activeMainTab,
  onSelectMainTab,
}) {
  const [chartMode, setChartMode] = useState("area"); // 'area' | 'candle'
  const [aiQuestion, setAiQuestion] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("about"); // 'about' | 'tokenomics' | 'financials' | 'dominance'
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [hoverData, setHoverData] = useState(null);
  const [w, setW] = useState(780);
  const svgWrapRef = useRef(null);

  const c = coin;
  const m = c?.market_data;
  const sym = (c?.symbol || "BTC").toUpperCase();
  const name = c?.name || "Bitcoin";

  // AI Assistant responses generator
  const aiAnswers = useMemo(() => {
    const chg24 = m?.price_change_percentage_24h ?? 0;
    const dir = chg24 >= 0 ? "gaining" : "pulling back";
    const low24 = m?.low_24h?.usd;
    const high24 = m?.high_24h?.usd;
    return {
      "What happened to BTC today?": `${name} is currently trading at ${fmtPrice(currentPrice)}, ${dir} ${fmtPct(chg24)} over the last 24 hours. The market has observed institutional rotation and macro anticipation around Federal Reserve interest rate guidance, driving $${m?.total_volume?.usd ? (m.total_volume.usd / 1e9).toFixed(1) : "20"}B in spot exchange volume.`,
      "What's the outlook for BTC this month?": `Analysts expect elevated volatility leading into the upcoming FOMC rate decision. Key support sits at ${low24 ? fmtPrice(low24) : "$75,000"} while resistance is pegged near recent local highs at ${high24 ? fmtPrice(high24) : "$80,000"}. Exchange reserves remain near multi-year lows, favoring long-term supply constraints.`,
      "What is BTC and what does it do?": `${name} (${sym}) is the first decentralized digital currency created by Satoshi Nakamoto in 2008. It utilizes a proof-of-work consensus algorithm to enable peer-to-peer value transfer without intermediaries, operating as both a payment network and scarce digital gold with a hard cap of 21 million units.`,
      "How's the sentiment for BTC?": `The community sentiment is currently ${Math.round(c?.sentiment_votes_up_percentage || 78)}% Bullish. Derivatives open interest has held steady, while long-term holder accumulation addresses continue absorbing liquid supply off centralized exchanges.`,
    };
  }, [name, sym, currentPrice, m, c]);

  // Chart rendering model
  const H = 380;
  const PAD = { t: 20, r: 65, b: 35, l: 15 };

  const chartModel = useMemo(() => {
    if (!points || points.length < 2) return null;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeY = maxY - minY || 1;
    const innerW = w - PAD.l - PAD.r;

    const scaleX = (x) => PAD.l + ((x - minX) / (maxX - minX || 1)) * innerW;
    const scaleY = (y) => PAD.t + (1 - (y - minY) / rangeY) * (H - PAD.t - PAD.b);

    const pts = points.map((p) => ({
      x: scaleX(p[0]),
      y: scaleY(p[1]),
      t: p[0],
      v: p[1],
    }));

    // Area path
    const area = `M ${pts[0].x} ${H - PAD.b} L ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${pts[pts.length - 1].x} ${H - PAD.b} Z`;
    // Line path
    const line = `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")}`;

    // Y ticks (4 levels)
    const yTicks = [0.1, 0.4, 0.7, 0.95].map((pct) => {
      const val = minY + rangeY * pct;
      const y = scaleY(val);
      return { val, y };
    });

    // X ticks (5 dates)
    const step = Math.floor(pts.length / 4);
    const xTicks = [0, step, step * 2, step * 3, pts.length - 1].map((idx) => {
      const p = pts[Math.min(idx, pts.length - 1)];
      const d = new Date(p.t);
      const label = days === 1 ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" });
      return { x: p.x, label };
    });

    return { pts, area, line, yTicks, xTicks, minY, maxY };
  }, [points, w, days]);

  useEffect(() => {
    if (!svgWrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 200) {
          setW(entry.contentRect.width);
        }
      }
    });
    ro.observe(svgWrapRef.current);
    return () => ro.disconnect();
  }, []);

  const onMouseMove = (e) => {
    if (!chartModel || !svgWrapRef.current) return;
    const rect = svgWrapRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let closest = chartModel.pts[0];
    let minDiff = Infinity;
    for (const pt of chartModel.pts) {
      const diff = Math.abs(pt.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }
    setHoverData(closest);
  };

  const chartColor = m?.price_change_percentage_24h >= 0 ? "#16c784" : "#ea3943";

  // Multi-window performance percentages from market_data
  const perfWindows = [
    { label: "1h", val: m?.price_change_percentage_1h_in_currency?.usd },
    { label: "24h", val: m?.price_change_percentage_24h },
    { label: "7d", val: m?.price_change_percentage_7d },
    { label: "14d", val: m?.price_change_percentage_14d },
    { label: "30d", val: m?.price_change_percentage_30d },
    { label: "1y", val: m?.price_change_percentage_1y },
  ];

  return (
    <div className="cg-center-column">
      {/* Promotional Video Ad Banner (Top Middle) */}
      <PromoVideoBanner className="cg-top-middle-ad" />

      {/* 1. Main Navigation Tabs */}
      <div className="cg-main-tabs-bar">
        <div className="cg-tabs-list">
          {["Overview", "Markets", "Treasuries", "News", "Similar Coins", "Historical Data ↗", `${sym} Halving ↗`].map((tab) => {
            const isExternal = tab.includes("↗");
            const clean = tab.replace(" ↗", "");
            const isActive = activeMainTab === clean.toLowerCase() || (tab === "Overview" && activeMainTab === "overview");
            return (
              <button
                key={tab}
                type="button"
                className={`cg-main-tab ${isActive ? "active" : ""}`}
                onClick={() => {
                  if (isExternal) return;
                  const key = clean.toLowerCase();
                  onSelectMainTab(key);
                  const el = document.getElementById(key);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        <a
          href="https://www.kraken.com"
          target="_blank"
          rel="noreferrer"
          className="cg-trade-btn-kraken"
        >
          <span>Trade on Kraken</span>
          <span>↗</span>
        </a>
      </div>

      {/* 2. Chart Toolbar Controls */}
      <div className="cg-chart-toolbar">
        <div className="cg-toolbar-left">
          <button type="button" className="cg-tool-pill active">
            <span>Price</span>
            <span>▾</span>
          </button>
          <button type="button" className="cg-tool-pill">
            <span>Compare</span>
            <span>▾</span>
          </button>
          <div className="cg-tool-icons">
            <button
              type="button"
              className={`cg-icon-tool ${chartMode === "area" ? "active" : ""}`}
              onClick={() => setChartMode("area")}
              title="Area Line Chart"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </button>
            <button
              type="button"
              className={`cg-icon-tool ${chartMode === "candle" ? "active" : ""}`}
              onClick={() => setChartMode("candle")}
              title="Candlestick Chart"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="7" y="5" width="3" height="14" rx="1" />
                <line x1="8.5" y1="2" x2="8.5" y2="5" />
                <line x1="8.5" y1="19" x2="8.5" y2="22" />
                <rect x="14" y="8" width="3" height="10" rx="1" />
                <line x1="15.5" y1="5" x2="15.5" y2="8" />
                <line x1="15.5" y1="18" x2="15.5" y2="21" />
              </svg>
            </button>
          </div>
        </div>

        <div className="cg-toolbar-right">
          <div className="cg-timeframes-list">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.label}
                type="button"
                className={`cg-tf-btn ${days === t.days ? "active" : ""}`}
                onClick={() => onSelectDays(t.days)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="cg-tool-icons extra">
            <button type="button" className="cg-icon-tool" title="Camera snapshot">
              📷
            </button>
            <button type="button" className="cg-icon-tool mono" title="Logarithmic axis">
              log
            </button>
            <button type="button" className="cg-icon-tool" title="Fullscreen chart">
              ⛶
            </button>
          </div>
        </div>
      </div>

      {/* 3. The SVG Price Chart */}
      <div className="cg-chart-canvas-wrap" ref={svgWrapRef}>
        {chartModel ? (
          <>
            <svg
              width={w}
              height={H}
              className="cg-price-svg"
              onMouseMove={onMouseMove}
              onMouseLeave={() => setHoverData(null)}
            >
              <defs>
                <linearGradient id="cg-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines & Right Axis Price Labels */}
              {chartModel.yTicks.map((t, idx) => (
                <g key={idx}>
                  <line
                    x1={PAD.l}
                    x2={w - PAD.r}
                    y1={t.y}
                    y2={t.y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={w - PAD.r + 8}
                    y={t.y + 4}
                    fill="#767ca0"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    ${t.val >= 1000 ? `${(t.val / 1000).toFixed(1)}K` : t.val.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Time ticks on bottom axis */}
              {chartModel.xTicks.map((xt, idx) => (
                <text
                  key={idx}
                  x={xt.x}
                  y={H - 10}
                  fill="#767ca0"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {xt.label}
                </text>
              ))}

              {/* Area & Line */}
              <path d={chartModel.area} fill="url(#cg-area-grad)" />
              <path
                d={chartModel.line}
                fill="none"
                stroke={chartColor}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Watermark */}
              <text
                x={w - PAD.r - 20}
                y={H - PAD.b - 15}
                fill="rgba(255,255,255,0.08)"
                fontSize="13"
                fontWeight="700"
                textAnchor="end"
                fontFamily="Outfit, sans-serif"
              >
                ● coingecko
              </text>

              {/* Interactive Hover crosshair & dot */}
              {hoverData && (
                <g>
                  <line
                    x1={hoverData.x}
                    x2={hoverData.x}
                    y1={PAD.t}
                    y2={H - PAD.b}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={hoverData.x}
                    cy={hoverData.y}
                    r="5"
                    fill="#ffffff"
                    stroke={chartColor}
                    strokeWidth="2.5"
                  />
                </g>
              )}
            </svg>

            {/* Hover tooltip card */}
            {hoverData && (
              <div
                className="cg-hover-tooltip glass"
                style={{
                  left: Math.min(w - 180, Math.max(20, hoverData.x - 70)),
                  top: Math.max(10, hoverData.y - 65),
                }}
              >
                <div className="mono font-semibold" style={{ color: chartColor, fontSize: 13 }}>
                  {fmtPrice(hoverData.v)}
                </div>
                <div className="mono text-muted" style={{ fontSize: 10 }}>
                  {new Date(hoverData.t).toLocaleString()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="cg-chart-loading">
            <span className="live-dot" /> Loading real-time market chart…
          </div>
        )}
      </div>

      {/* Chart Mini Navigator matching CoinGecko */}
      <div className="cg-chart-navigator">
        <div className="cg-nav-years mono">
          <span>2014</span>
          <span>2016</span>
          <span>2018</span>
          <span>2020</span>
          <span>2022</span>
          <span>2024</span>
          <span>2026</span>
        </div>
        <div className="cg-nav-track">
          <div className="cg-nav-selected-window" />
        </div>
        <div className="cg-api-callout" style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
          <a href="https://www.coingecko.com/en/api" target="_blank" rel="noreferrer">
            Need more data? Explore our API ↗
          </a>
        </div>
      </div>

      {/* Multi-Window Performance Returns Table (1h, 24h, 7d, 14d, 30d, 1y) */}
      <div className="cg-perf-table-wrap">
        <table className="cg-perf-table mono">
          <thead>
            <tr>
              {perfWindows.map((w) => (
                <th key={w.label}>{w.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {perfWindows.map((w) => {
                const v = w.val;
                const isPos = (v ?? 0) >= 0;
                return (
                  <td key={w.label} className={isPos ? "up" : "down"}>
                    <span>{isPos ? "▲" : "▼"}</span> {v != null ? `${Math.abs(v).toFixed(1)}%` : "—"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ask Gecko AI Assistant Box */}
      <div className="cg-ask-ai-box">
        <div className="cg-ai-head-row">
          <div className="cg-ai-title">
            <span className="cg-ai-spark">✨</span>
            <span className="cg-ai-name">Ask Gecko AI</span>
            <span className="cg-ai-info">ⓘ</span>
          </div>
        </div>

        <div className="cg-ai-pills-row">
          {Object.keys(aiAnswers).map((q) => (
            <button
              key={q}
              type="button"
              className={`cg-ai-pill ${aiQuestion === q ? "active" : ""}`}
              onClick={() => setAiQuestion(aiQuestion === q ? null : q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* AI Answer Expandable Drawer */}
        {aiQuestion && (
          <div className="cg-ai-answer-drawer">
            <div className="cg-ai-answer-head">
              <span className="cg-ai-drawer-spark">✦ Gecko AI Market Synthesis</span>
              <button
                type="button"
                className="cg-ai-close-btn"
                onClick={() => setAiQuestion(null)}
              >
                ✕
              </button>
            </div>
            <p className="cg-ai-answer-text">{aiAnswers[aiQuestion]}</p>
          </div>
        )}
      </div>

      {/* Sponsored Ad Bar (matching reference Stake/Game promo) */}
      <div className="cg-sponsored-bar">
        <div className="cg-spon-left">
          <span className="cg-spon-badge">AD</span>
          <span className="cg-spon-text">Join Stake Casino! Get 200% & Bonus Daily Bonuses</span>
        </div>
        <a
          href="https://stake.com"
          target="_blank"
          rel="noreferrer"
          className="cg-spon-btn"
        >
          Claim Now
        </a>
      </div>

      {/* 4. About & Fundamental Tabs Section */}
      <div className="cg-about-section" id="overview">
        <div className="cg-subtabs-bar">
          {[
            { id: "about", label: "About" },
            { id: "tokenomics", label: "Tokenomics" },
            { id: "financials", label: "Financials" },
            { id: "dominance", label: "Dominance" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              className={`cg-subtab-btn ${activeSubTab === st.id ? "active" : ""}`}
              onClick={() => setActiveSubTab(st.id)}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Dynamic Sub-tab content */}
        {activeSubTab === "about" && (
          sym === "BTC" ? (
            <div className="cg-about-article">
              <h2 className="cg-art-h2">About Bitcoin (BTC)</h2>
              <p className="cg-art-p lead">
                Bitcoin is the world's first decentralized cryptocurrency that enables peer-to-peer electronic cash transactions without intermediaries like banks or governments.
              </p>
              <p className="cg-art-p">
                Bitcoin operates on a blockchain secured by proof-of-work mining and the SHA-256 cryptographic algorithm, making it virtually impossible to counterfeit or double-spend. With a fixed supply cap of 21 million coins and programmatic halvings every four years, Bitcoin is designed as a deflationary digital asset often called <em>"digital gold."</em>
              </p>
              <p className="cg-art-p">
                Bitcoin has achieved mainstream adoption through spot ETF approvals, corporate treasury holdings, and acceptance by governments and institutions worldwide.
              </p>

              <h3 className="cg-art-h3">Who Created Bitcoin?</h3>
              <p className="cg-art-p">
                Bitcoin was created by an individual or group using the pseudonym <strong>Satoshi Nakamoto</strong>, whose true identity remains unknown to this day. In October 2008, Nakamoto published the Bitcoin whitepaper titled <em>"Bitcoin: A Peer-to-Peer Electronic Cash System,"</em> laying out the technical foundation for a revolutionary digital currency. The first Bitcoin block, known as the genesis block, was mined on January 3, 2009, marking the official launch of the Bitcoin network.
              </p>
              <p className="cg-art-p">
                Nakamoto actively developed Bitcoin and communicated with the early community until mid-2010, when they handed over control of the network and disappeared from public view.
              </p>

              {aboutExpanded && (
                <>
                  <h3 className="cg-art-h3">How Does Bitcoin Work?</h3>
                  <p className="cg-art-p">
                    Bitcoin operates as a decentralized peer-to-peer network where users exchange value directly without intermediaries. The network maintains a public ledger called the blockchain, which records all transactions chronologically.
                  </p>
                  <p className="cg-art-p">
                    Transactions are grouped into blocks, with each block containing a cryptographic hash of the previous block, creating an immutable chain. New blocks are added approximately every 10 minutes through proof-of-work mining.
                  </p>

                  <h3 className="cg-art-h3">Bitcoin Security: SHA-256 Hashing Algorithm</h3>
                  <p className="cg-art-p">
                    Bitcoin's security is fundamentally rooted in the <strong>SHA-256</strong> cryptographic hash function, ensuring network consensus and transaction verification.
                  </p>

                  <h3 className="cg-art-h3">How to Keep Your Bitcoins Safe</h3>
                  <p className="cg-art-p">
                    Securing Bitcoin means protecting private keys—the cryptographic codes that prove ownership and authorize transactions. The golden rule of Bitcoin security is <em>"not your keys, not your coins."</em>
                  </p>
                </>
              )}

              <button
                type="button"
                className="cg-read-more-btn"
                onClick={() => setAboutExpanded(!aboutExpanded)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6e8bff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  marginTop: 10,
                  padding: "4px 0",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>{aboutExpanded ? "Show Less" : "Read More"}</span>
                <span>{aboutExpanded ? "▲" : "▼"}</span>
              </button>
            </div>
          ) : (
            <div className="cg-generic-article">
              <h2 className="cg-art-h2">About {name} ({sym})</h2>
              {c?.description?.en ? (
                <div
                  className="cg-desc-html"
                  dangerouslySetInnerHTML={{ __html: c.description.en }}
                />
              ) : (
                <p className="cg-art-p">
                  {name} is an active digital asset operating on blockchain technology with a circulating supply of {m?.circulating_supply ? fmtCompact(m.circulating_supply).replace("$", "") : "—"} {sym}.
                </p>
              )}
            </div>
          )
        )}

        {activeSubTab === "tokenomics" && (
          <div className="cg-tokenomics-pane">
            <h3 className="cg-art-h3">{name} Tokenomics & Distribution</h3>
            <div className="cg-tokenomics-grid">
              <div className="cg-tok-card">
                <span className="cg-tok-label">Circulating Supply</span>
                <span className="cg-tok-val mono font-semibold">{m?.circulating_supply ? fmtPrice(m.circulating_supply).replace("$", "") : "—"}</span>
              </div>
              <div className="cg-tok-card">
                <span className="cg-tok-label">Total Supply</span>
                <span className="cg-tok-val mono font-semibold">{m?.total_supply ? fmtPrice(m.total_supply).replace("$", "") : "—"}</span>
              </div>
              <div className="cg-tok-card">
                <span className="cg-tok-label">Max Theoretical Supply</span>
                <span className="cg-tok-val mono font-semibold">{m?.max_supply ? fmtPrice(m.max_supply).replace("$", "") : "Infinite / Uncapped"}</span>
              </div>
              <div className="cg-tok-card">
                <span className="cg-tok-label">Issuance Mechanism</span>
                <span className="cg-tok-val mono font-semibold">{c?.hashing_algorithm || "Proof-of-Stake / Smart Contract"}</span>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "financials" && (
          <div className="cg-financials-pane">
            <h3 className="cg-art-h3">Financial Valuation Ratios</h3>
            <div className="cg-tokenomics-grid">
              <div className="cg-tok-card">
                <span className="cg-tok-label">Market Cap</span>
                <span className="cg-tok-val mono font-semibold">{m?.market_cap?.usd ? fmtCompact(m.market_cap.usd) : "—"}</span>
              </div>
              <div className="cg-tok-card">
                <span className="cg-tok-label">Fully Diluted Valuation</span>
                <span className="cg-tok-val mono font-semibold">{m?.fully_diluted_valuation?.usd ? fmtCompact(m.fully_diluted_valuation.usd) : "—"}</span>
              </div>
              <div className="cg-tok-card">
                <span className="cg-tok-label">Volume / Market Cap</span>
                <span className="cg-tok-val mono font-semibold">{m?.total_volume?.usd && m?.market_cap?.usd ? (m.total_volume.usd / m.market_cap.usd).toFixed(3) : "—"}</span>
              </div>
              <div className="cg-tok-card">
                <span className="cg-tok-label">Rank</span>
                <span className="cg-tok-val mono font-semibold">#{c?.market_cap_rank || "—"}</span>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "dominance" && (
          <div className="cg-dominance-pane">
            <h3 className="cg-art-h3">Market Cap Dominance</h3>
            <p className="cg-art-p">
              {sym} represents a substantial portion of the global cryptocurrency asset capitalization, maintaining a high institutional liquidity profile across both centralized exchanges and decentralized derivatives markets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

