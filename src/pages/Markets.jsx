import { useState } from "react";
import { usePolling } from "../hooks/usePolling";
import { getMarkets, getGlobal, peekMarkets, peekGlobal, fmtCompact, fmtPct } from "../api/coingecko";
import CoinTable from "../components/CoinTable";
import BackButton from "../components/BackButton";

const PER_PAGE = 50;

const FILTERS = [
  { key: "all", label: "All coins" },
  { key: "traded", label: "Most traded" },
  { key: "gainers", label: "Top gainers" },
  { key: "losers", label: "Top losers" },
];

function GlobalStrip({ g }) {
  const btcDom = g?.market_cap_percentage?.btc ? Number(g.market_cap_percentage.btc.toFixed(1)) : null;
  const ethDom = g?.market_cap_percentage?.eth ? Number(g.market_cap_percentage.eth.toFixed(1)) : null;

  const items = [
    {
      label: "Market Cap",
      val: g ? fmtCompact(g.total_market_cap?.usd) : "—",
      delta: g?.market_cap_change_percentage_24h_usd,
      color: "#00e599",
      glow: "rgba(0, 229, 153, 0.45)",
    },
    {
      label: "24h Volume",
      val: g ? fmtCompact(g.total_volume?.usd) : "—",
      color: "#38bdf8",
      glow: "rgba(56, 189, 248, 0.45)",
    },
    {
      label: "BTC Dominance",
      val: btcDom != null ? `${btcDom}%` : "—",
      progress: btcDom,
      barColor: "#f59e0b",
      color: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.45)",
    },
    {
      label: "ETH Dominance",
      val: ethDom != null ? `${ethDom}%` : "—",
      progress: ethDom,
      barColor: "#6366f1",
      color: "#8b5cf6",
      glow: "rgba(139, 92, 246, 0.45)",
    },
    {
      label: "Active Assets",
      val: g ? g.active_cryptocurrencies?.toLocaleString() : "—",
      color: "#ec4899",
      glow: "rgba(236, 72, 153, 0.45)",
    },
    {
      label: "Total Markets",
      val: g ? g.markets?.toLocaleString() : "—",
      color: "#14b8a6",
      glow: "rgba(20, 184, 166, 0.45)",
    },
  ];

  return (
    <div className="global-strip markets-stat-grid">
      {items.map((it) => (
        <div
          className="m-stat-card"
          key={it.label}
          style={{ "--indicator-color": it.color, "--indicator-glow": it.glow }}
        >
          <span className="m-stat-indicator" />
          <div className="m-stat-top">
            <span className="m-stat-label">{it.label}</span>
            {it.delta != null && (
              <span className={`m-stat-delta mono ${it.delta >= 0 ? "up" : "down"}`}>
                {it.delta >= 0 ? "▲" : "▼"} {Math.abs(it.delta).toFixed(2)}%
              </span>
            )}
          </div>
          <div className="m-stat-value mono">{it.val}</div>
          {it.progress != null && (
            <div className="m-stat-progress-track">
              <div
                className="m-stat-progress-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, it.progress))}%`,
                  background: it.barColor,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Markets() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");

  const isMover = filter === "gainers" || filter === "losers";
  const order = filter === "traded" ? "volume_desc" : "market_cap_desc";

  const { data, loading, refreshing, updatedAt, error } = usePolling(
    () =>
      isMover
        ? // Rank a broad slice by 24h change, client-side.
          getMarkets({ page: 1, perPage: 100, order: "market_cap_desc" }).then((list) => {
            const s = [...list].sort(
              (a, b) =>
                (b.price_change_percentage_24h_in_currency ?? -1e9) -
                (a.price_change_percentage_24h_in_currency ?? -1e9)
            );
            return filter === "gainers" ? s.slice(0, PER_PAGE) : s.reverse().slice(0, PER_PAGE);
          })
        : getMarkets({ page, perPage: PER_PAGE, order }),
    { interval: 60_000, deps: [filter, page], initialData: page === 1 && filter === "all" ? peekMarkets : null }
  );
  const global = usePolling(() => getGlobal(), { interval: 120_000, initialData: peekGlobal });
  const g = global.data?.data;

  const coins = data || [];

  function pick(key) {
    setFilter(key);
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="markets-page">
      <div className="container">
        <BackButton fallback="/" />
        <div className="markets-hero">
          <div className="markets-hero-main">
            <span className="markets-eyebrow mono">Terminal · Markets</span>
            <h1 className="display markets-title">Explore the market</h1>
            <p className="markets-subtitle">
              {g ? (
                <>
                  Tracking <span className="mono bold-stat">{g.active_cryptocurrencies?.toLocaleString()}</span> assets ·{" "}
                  <span className="mono bold-stat">{fmtCompact(g.total_market_cap?.usd)}</span> total cap
                </>
              ) : (
                "Loading market data…"
              )}
            </p>
          </div>
          <div className="markets-status-badge">
            <span className="live-dot" />
            <span className="mono">
              {refreshing ? "Updating…" : updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Live"}
            </span>
          </div>
        </div>

        <GlobalStrip g={g} />

        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-pill ${filter === f.key ? "active" : ""}`}
              onClick={() => pick(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && !coins.length && <div className="error-banner glass">{error}</div>}

        {loading && !coins.length ? (
          <div className="table-wrap glass" style={{ padding: 18 }}>
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 46, marginBottom: 10 }} />)}
          </div>
        ) : (
          <CoinTable coins={coins} />
        )}

        {!isMover && (
          <div className="pager">
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              ← Previous
            </button>
            <span className="pager-label mono">Page {page}</span>
            <button className="btn btn-ghost" disabled={coins.length < PER_PAGE} onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
