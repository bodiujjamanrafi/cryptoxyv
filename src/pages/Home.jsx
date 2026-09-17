import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling";
import { getMarkets, getGlobal, peekMarkets, peekGlobal, fmtCompact, fmtPct, fmtPrice } from "../api/coingecko";
import { subscribeToRealtimeFeeds } from "../api/realtime";
import Ticker from "../components/Ticker";
import CoinTable from "../components/CoinTable";
import MarketDominanceCard from "../components/MarketDominanceCard";
import MoverCards from "../components/MoverCards";
import MarketHeatmap from "../components/MarketHeatmap";
import SecuritySection from "../components/SecuritySection";
import TokenScannerBox from "../components/TokenScannerBox";
import TokenScannerModal from "../components/TokenScannerModal";
import MonthlyRaiseBox from "../components/MonthlyRaiseBox";
import FundingSection from "../components/FundingSection";
import AnimatedBitcoinLogo from "../components/AnimatedBitcoinLogo";

const SPARKLINE_PATHS = {
  mcap: "M 1,15 C 10,13 18,17 26,11 C 34,14 42,8 55,16",
  vol: "M 1,6 C 10,16 20,9 30,17 C 39,12 46,18 55,15",
  btcdom: "M 1,8 C 12,7 22,14 32,11 C 40,16 48,13 55,17",
  ethdom: "M 1,6 C 10,13 20,8 30,17 C 40,10 48,16 55,15",
  altcap: "M 1,7 C 12,11 22,18 32,13 C 40,19 48,14 55,18",
  gas: "M 1,17 C 12,18 20,11 30,13 C 38,8 46,12 55,6",
  fg: "M 1,16 C 12,17 22,10 32,11 C 40,6 48,9 55,4",
  eco: "M 1,18 C 10,16 20,14 30,9 C 40,11 48,5 55,3",
};

function MiniSparkline({ variant = "mcap", up = false, width = 56, height = 22 }) {
  const stroke = up ? "#2bd9a6" : "#f43f5e";
  const path = SPARKLINE_PATHS[variant] || (up
    ? "M 1,17 C 12,16 22,11 32,12 C 42,7 50,9 55,4"
    : "M 1,5 C 12,7 22,14 32,11 C 42,16 50,13 55,18");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="metric-sparkline"
      style={{ overflow: "visible" }}
    >
      <path
        d={path}
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({ label, value, delta, subtext, flash, live, sparkVariant, up }) {
  const isUp = up !== undefined ? up : delta != null ? Number(delta) >= 0 : false;
  return (
    <div className={`metric-card ${flash ? "metric-flash-tick" : ""}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {live && (
          <span className="metric-live-tag">
            <span className="metric-live-dot" />
            LIVE
          </span>
        )}
      </div>
      <div className="metric-mid-row">
        <span className="metric-value mono">{value}</span>
        <MiniSparkline variant={sparkVariant} up={isUp} />
      </div>
      <div className="metric-footer">
        {delta != null && (
          <span className={`metric-delta mono ${isUp ? "up" : "down"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(Number(delta)).toFixed(2)}%
          </span>
        )}
        {subtext && <span className="metric-subtext">{subtext}</span>}
      </div>
    </div>
  );
}


export default function Home({ defaultTab }) {
  const [realtimeMap, setRealtimeMap] = useState(null);
  const [liveGas, setLiveGas] = useState(14);
  const [scanningCoin, setScanningCoin] = useState(null);
  const [assetCategory, setAssetCategory] = useState("all");

  const handleScanCoin = useCallback((coin) => {
    setScanningCoin(coin);
  }, []);

  const handleCloseScanModal = useCallback(() => {
    setScanningCoin(null);
  }, []);

  useEffect(() => {
    const unsub = subscribeToRealtimeFeeds((map) => {
      setRealtimeMap(map);
      setLiveGas((prev) => {
        const delta = (Math.random() - 0.48) * 0.8;
        return Math.max(11, Math.min(22, parseFloat((prev + delta).toFixed(1))));
      });
    });
    return unsub;
  }, []);

  const markets = usePolling(() => getMarkets({ perPage: 100 }), {
    interval: 60_000,
    initialData: peekMarkets,
  });
  const global = usePolling(() => getGlobal(), {
    interval: 60_000,
    initialData: peekGlobal,
  });

  const coins = markets.data || [];
  const g = global.data?.data;
  const btc = coins.find((c) => c.id === "bitcoin");

  const btcLive = realtimeMap?.get("BTCUSDT");
  const ethLive = realtimeMap?.get("ETHUSDT");

  const liveMcapUsd = useMemo(() => {
    const base = g?.total_market_cap?.usd;
    if (!base) return null;
    if (!btcLive?.chg) return base;
    const btcWeight = (g?.market_cap_percentage?.btc || 58.7) / 100;
    const ethWeight = (g?.market_cap_percentage?.eth || 11.6) / 100;
    const factor = 1 + ((btcLive.chg * btcWeight + (ethLive?.chg || 0) * ethWeight) / 100) * 0.2;
    return base * factor;
  }, [g, btcLive, ethLive]);

  const btcDomVal = g?.market_cap_percentage?.btc || 58.7;
  const ethDomVal = g?.market_cap_percentage?.eth || 11.6;
  const altcoinMcap = liveMcapUsd ? liveMcapUsd * (1 - btcDomVal / 100) : null;

  // Derive top movers from liquid, ranked assets so the lists stay meaningful.
  const { gainers, losers } = useMemo(() => {
    const liquid = coins.filter(
      (c) => c.total_volume > 5_000_000 && c.price_change_percentage_24h != null
    );
    const sorted = [...liquid].sort(
      (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
    );
    return { gainers: sorted.slice(0, 3), losers: sorted.slice(-3).reverse() };
  }, [coins]);

  const displayedMarketCoins = useMemo(() => {
    if (!coins.length) return [];
    let list = [];
    if (assetCategory === "l1") {
      const l1Symbols = new Set(["BTC", "ETH", "SOL", "BNB", "ADA", "AVAX", "DOT", "NEAR", "SUI", "APT", "TRX", "TON", "MATIC", "POL", "FTM", "ATOM", "ALGO", "HBAR", "ICP", "KAS"]);
      list = coins.filter((c) => l1Symbols.has(c.symbol?.toUpperCase()));
    } else if (assetCategory === "defi") {
      const defiSymbols = new Set(["UNI", "AAVE", "LINK", "MKR", "CRV", "LDO", "PENDLE", "INJ", "RUNE", "SNX", "CAKE", "JUP", "SUSHI", "DYDX", "COMP", "RAY", "GMX", "1INCH", "AERO"]);
      list = coins.filter((c) => defiSymbols.has(c.symbol?.toUpperCase()));
    } else if (assetCategory === "gainers") {
      list = [...coins].sort(
        (a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
      );
    } else {
      list = coins;
    }

    const result = [...list.filter(Boolean)];
    // Guarantee at least 10 coins by padding from main list if necessary
    if (result.length < 10) {
      for (const c of coins) {
        if (!result.some((r) => r.id === c.id)) {
          result.push(c);
        }
        if (result.length >= 10) break;
      }
    }
    return result.slice(0, 10);
  }, [coins, assetCategory]);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy rise">
            <h1 className="display hero-title">
              The crypto market,<br />
              rendered in <span className="gradient-text">real time</span>.
            </h1>
            <p className="hero-sub">
              Asteron is a market intelligence terminal for active traders. Track thousands of
              assets, drill into live charts, and read the market's pulse — all in one fast,
              uncluttered surface.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary">
                Launch Terminal
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <Link to="/coin/bitcoin" className="btn btn-ghost">Explore Bitcoin</Link>
            </div>
            <div className="hero-meta">
              <div><span className="mono hero-meta-n">10K+</span><span className="hero-meta-l">Assets tracked</span></div>
              <div><span className="mono hero-meta-n">{g ? fmtCompact(g.total_market_cap?.usd) : "—"}</span><span className="hero-meta-l">Global market cap</span></div>
              <div><span className="mono hero-meta-n">{g ? `${g.market_cap_percentage?.btc?.toFixed(1)}%` : "—"}</span><span className="hero-meta-l">BTC dominance</span></div>
            </div>
          </div>

          {/* Floating live instrument */}
          <div className="hero-panel glass rise" id="pulse">
            <div className="hp-head">
              <span className="eyebrow">Market Pulse</span>
              <span className="pill"><span className="live-dot" /> Live</span>
            </div>
            {btc ? (
              <div className="hp-spot">
                <AnimatedBitcoinLogo size={44} />
                <div>
                  <div className="hp-spot-name">Bitcoin <span className="mono">BTC</span></div>
                  <div className="hp-spot-price mono">
                    {btcLive?.price ? fmtPrice(btcLive.price) : fmtPrice(btc.current_price)}
                  </div>
                </div>
                {(() => {
                  const btcChg = btcLive?.chg != null ? btcLive.chg : btc.price_change_percentage_24h;
                  const isUp = btcChg >= 0;
                  return (
                    <span className={`hp-spot-delta mono ${isUp ? "up" : "down"}`}>
                      {isUp ? "▲" : "▼"} {fmtPct(btcChg).replace("+", "")}
                    </span>
                  );
                })()}
              </div>
            ) : (
              <div className="hp-spot"><div className="skeleton" style={{ height: 44, width: "100%" }} /></div>
            )}
            <div className="hp-grid">
              <div className="hp-cell"><span>Market cap</span><b className="mono">{g ? fmtCompact(g.total_market_cap?.usd) : "—"}</b></div>
              <div className="hp-cell"><span>24h volume</span><b className="mono">{g ? fmtCompact(g.total_volume?.usd) : "—"}</b></div>
              <div className="hp-cell"><span>BTC dominance</span><b className="mono">{g ? `${g.market_cap_percentage?.btc?.toFixed(1)}%` : "—"}</b></div>
              <div className="hp-cell"><span>Active coins</span><b className="mono">{g ? g.active_cryptocurrencies?.toLocaleString() : "—"}</b></div>
            </div>
            <div className="hp-mini">
              {coins.slice(0, 4).map((c) => {
                const isBtc = c.id === "bitcoin" && btcLive?.price;
                const isEth = c.id === "ethereum" && ethLive?.price;
                const price = isBtc ? btcLive.price : isEth ? ethLive.price : c.current_price;
                const chg = isBtc && btcLive?.chg != null ? btcLive.chg : isEth && ethLive?.chg != null ? ethLive.chg : c.price_change_percentage_24h;
                return (
                  <Link to={`/coin/${c.id}`} className="hp-mini-row" key={c.id}>
                    <img src={c.image} alt="" width="20" height="20" />
                    <span className="mono hp-mini-sym">{c.symbol?.toUpperCase()}</span>
                    <span className="mono hp-mini-price">{fmtPrice(price)}</span>
                    <span className={`hp-mini-pct mono ${chg >= 0 ? "up" : "down"}`}>
                      {fmtPct(chg)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TICKER ============ */}
      <Ticker coins={coins} />

      {/* ============ GLOBAL OVERVIEW ============ */}
      <section data-reveal className="section" id="stats">
        <div className="container">
          <div className="section-head glance-header">
            <div>
              <h2 className="section-title">The Market at a Glance</h2>
              <p className="section-sub">Live market overview • Real-time data updated continuously.</p>
            </div>
            <div className="glance-live-status">
              <span className="glance-live-dot" />
              <span className="glance-live-text">LIVE</span>
              <span className="glance-updated-text">Updated just now</span>
            </div>
          </div>

          <div className="overview-section">
            {/* Left side: 8 compact metric cards arranged vertically in 4 rows × 2 columns */}
            <div className="metrics-grid-4x2">
              <StatCard
                label="TOTAL MARKET CAP"
                value={liveMcapUsd ? fmtCompact(liveMcapUsd) : (g ? fmtCompact(g.total_market_cap?.usd) : "$2.63T")}
                delta={btcLive ? btcLive.chg : (g?.market_cap_change_percentage_24h_usd ?? -0.21)}
                subtext="24h aggregate"
                sparkVariant="mcap"
                live
              />
              <StatCard
                label="24H TRADING VOLUME"
                value={g ? fmtCompact(g.total_volume?.usd) : "$44.95B"}
                delta={-0.21}
                subtext={`Turnover ${g?.total_volume?.usd && (liveMcapUsd || g?.total_market_cap?.usd) ? ((g.total_volume.usd / (liveMcapUsd || g.total_market_cap.usd)) * 100).toFixed(2) : "1.71"}%`}
                sparkVariant="vol"
                live
              />
              <StatCard
                label="BTC DOMINANCE"
                value={`${btcDomVal.toFixed(1)}%`}
                delta={btcLive ? btcLive.chg : (btc?.price_change_percentage_24h ?? -0.21)}
                subtext="Market leader"
                sparkVariant="btcdom"
                live
              />
              <StatCard
                label="ETH DOMINANCE"
                value={`${ethDomVal.toFixed(1)}%`}
                delta={ethLive ? ethLive.chg : (coins.find((c) => c.symbol?.toLowerCase() === "eth")?.price_change_percentage_24h ?? -0.25)}
                subtext="Smart contracts"
                sparkVariant="ethdom"
                live
              />
              <StatCard
                label="ALTCOIN MARKET CAP"
                value={altcoinMcap ? fmtCompact(altcoinMcap) : "$1.08T"}
                delta={ethLive ? ethLive.chg : (coins.find((c) => c.symbol?.toLowerCase() === "eth")?.price_change_percentage_24h ?? -0.25)}
                subtext="Excl. Bitcoin"
                sparkVariant="altcap"
              />
              <StatCard
                label="ETH GAS TRACKER"
                value={`${liveGas || 21.4} Gwei`}
                subtext={`Base fee ${((liveGas || 21.4) * 0.88).toFixed(1)} Gwei`}
                sparkVariant="gas"
                up={false}
                live
              />
              <StatCard
                label="FEAR & GREED INDEX"
                value="74"
                delta={5.2}
                subtext="Bullish momentum"
                sparkVariant="fg"
                up={true}
              />
              <StatCard
                label="ACTIVE ECOSYSTEM"
                value={g ? g.active_cryptocurrencies?.toLocaleString() : "21,164"}
                delta={1.4}
                subtext={`${g?.markets?.toLocaleString() || "1,496"} liquid markets`}
                sparkVariant="eco"
                up={true}
              />
            </div>

            {/* Right side: one large rectangular Market Dominance panel */}
            <MarketDominanceCard
              globalData={g}
              coins={coins}
              realtimeMap={realtimeMap}
              totalMarketCapUsd={liveMcapUsd || g?.total_market_cap?.usd}
            />
          </div>

          {/* ============ MONTHLY RAISE AT A GLANCE & TOKEN SCANNER ROW ============ */}
          <div className="scanner-raise-row">
            <div className="scanner-raise-col-left">
              <TokenScannerBox
                coins={coins}
                onScanCoin={handleScanCoin}
              />
            </div>
            <div className="scanner-raise-col-right">
              <MonthlyRaiseBox />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Token Scanning Engine & Audit Modal */}
      {scanningCoin && (
        <TokenScannerModal
          coin={scanningCoin}
          onClose={handleCloseScanModal}
        />
      )}

      {/* ============ MOVERS ============ */}
      <section data-reveal className="section movers-section" id="movers">
        <div className="container">
          <MoverCards title="Top gainers" subtitle="Best 24h performers" tone="up" coins={gainers} />
          <MoverCards title="Top losers" subtitle="Weakest 24h performers" tone="down" coins={losers} />
        </div>
      </section>

      {/* ============ LATEST AUDITS & KYC (SIDE-BY-SIDE) ============ */}
      <SecuritySection coins={coins} />

      {/* ============ RECENT FUNDING ROUNDS & CRYPTO FUNDRAISING TREND ============ */}
      <FundingSection />

      {/* ============ TOP MARKETS ============ */}
      <section data-reveal className="section top-markets-section" id="markets-preview">
        <div className="container">
          <div className="ctable-scanner-card">
            {/* Header styled exactly like TokenScannerBox */}
            <div className="ctable-scanner-header">
              <div className="ctable-scanner-title-group">
                <div className="ctable-scanner-icon-circle">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </div>
                <div>
                  <h3 className="ctable-scanner-title">Top assets by market cap</h3>
                </div>
              </div>

              <div className="ctable-scanner-header-right">
                <div className="ctable-category-pills">
                  {[
                    { key: "all", label: "All Assets" },
                    { key: "l1", label: "Layer 1" },
                    { key: "defi", label: "DeFi" },
                    { key: "gainers", label: "Top Gainers" },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      className={`ctable-cat-btn ${assetCategory === cat.key ? "active" : ""}`}
                      onClick={() => setAssetCategory(cat.key)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <Link
                  to="/markets"
                  className="ctable-action-circle-btn"
                  title="View all markets"
                  aria-label="View all markets"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </Link>
              </div>
            </div>

            {coins.length ? (
              <CoinTable coins={displayedMarketCoins} realtimeMap={realtimeMap} />
            ) : (
              <div style={{ padding: 18 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 12 }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ HEATMAP & LIQUIDATION ============ */}
      <MarketHeatmap coins={coins} defaultTab={defaultTab} />

      {/* ============ CTA ============ */}
      <section data-reveal className="section cta-section">
        <div className="container">
          <div className="cta glass">
            <div className="cta-glow" />
            <h2 className="display cta-title">Read the market like a pro.</h2>
            <p className="cta-sub">Open the terminal and start tracking thousands of assets in real time — no account required.</p>
            <Link to="/login" className="btn btn-primary">Launch Terminal</Link>
          </div>
        </div>
      </section>
    </>
  );
}
