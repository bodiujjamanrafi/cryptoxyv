import { useState, useRef, useEffect, useMemo, memo, useCallback } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { getMarkets, fmtPrice, fmtCompact, fmtPct } from "../api/coingecko";
import { subscribeToRealtimeFeeds, enrichWithRealtimeData } from "../api/realtime";

/* ------------------------------------------------------------
   Category Classifier
   ------------------------------------------------------------ */
const CATEGORY_MAP = {
  // Currency (Pure store-of-value / P2P currency)
  bitcoin: "Currency", btc: "Currency",
  litecoin: "Currency", ltc: "Currency",
  "bitcoin-cash": "Currency", bch: "Currency",
  monero: "Currency", xmr: "Currency",
  zcash: "Currency", zec: "Currency",
  dash: "Currency",
  kaspa: "Currency", kas: "Currency",

  // Stablecoin
  tether: "Stablecoin", usdt: "Stablecoin",
  "usd-coin": "Stablecoin", usdc: "Stablecoin",
  usds: "Stablecoin",
  ethena_usde: "Stablecoin", "ethena-usde": "Stablecoin", usde: "Stablecoin",
  dai: "Stablecoin",
  "first-digital-usd": "Stablecoin", fdusd: "Stablecoin",
  "paypal-usd": "Stablecoin", pyusd: "Stablecoin",
  "true-usd": "Stablecoin", tusd: "Stablecoin",
  usdd: "Stablecoin",
  usd1: "Stablecoin",
  rlusd: "Stablecoin",
  frax: "Stablecoin",

  // DeFi
  chainlink: "DeFi", link: "DeFi",
  uniswap: "DeFi", uni: "DeFi",
  aave: "DeFi",
  maker: "DeFi", mkr: "DeFi",
  pendle: "DeFi",
  ethena: "DeFi", ena: "DeFi",
  "curve-dao-token": "DeFi", crv: "DeFi",
  "lido-dao": "DeFi", ldo: "DeFi",
  jupiter: "DeFi", "jupiter-exchange-solana": "DeFi", jup: "DeFi",
  thorchain: "DeFi", rune: "DeFi",
  synthetix: "DeFi", snx: "DeFi",
  injective: "DeFi", inj: "DeFi",
  raydium: "DeFi", ray: "DeFi",

  // Meme
  dogecoin: "Meme", doge: "Meme",
  "shiba-inu": "Meme", shib: "Meme",
  pepe: "Meme",
  dogwifcoin: "Meme", dogwifhat: "Meme", wif: "Meme",
  bonk: "Meme",
  floki: "Meme",
  brett: "Meme",
  popcat: "Meme",
  bome: "Meme",
  mew: "Meme",
  neiro: "Meme",
  fartcoin: "Meme",

  // Exchange
  "binancecoin": "Exchange", bnb: "Exchange",
  okb: "Exchange",
  "leo-token": "Exchange", leo: "Exchange",
  bitget_token: "Exchange", bgb: "Exchange",
  kucoin_shares: "Exchange", kcs: "Exchange",
  gatechain_token: "Exchange", gt: "Exchange",
  whitebit_token: "Exchange", wbt: "Exchange",
  mxc_token: "Exchange", mx: "Exchange",

  // Blockchain / Smart Contract Platforms
  ethereum: "Blockchain", eth: "Blockchain",
  solana: "Blockchain", sol: "Blockchain",
  ripple: "Blockchain", xrp: "Blockchain",
  cardano: "Blockchain", ada: "Blockchain",
  avalanche: "Blockchain", "avalanche-2": "Blockchain", avax: "Blockchain",
  tron: "Blockchain", trx: "Blockchain",
  polkadot: "Blockchain", dot: "Blockchain",
  near: "Blockchain", "near-protocol": "Blockchain",
  sui: "Blockchain",
  aptos: "Blockchain", apt: "Blockchain",
  toncoin: "Blockchain", ton: "Blockchain",
  stellar: "Blockchain", xlm: "Blockchain",
  sei: "Blockchain", "sei-network": "Blockchain",
  celestia: "Blockchain", tia: "Blockchain",
  fantom: "Blockchain", ftm: "Blockchain", sonic: "Blockchain",
  algorand: "Blockchain", algo: "Blockchain",
  arbitrum: "Blockchain", arb: "Blockchain",
  optimism: "Blockchain", op: "Blockchain",
  "polygon-ecosystem-token": "Blockchain", pol: "Blockchain", matic: "Blockchain",
  hedera: "Blockchain", "hedera-hashgraph": "Blockchain", hbar: "Blockchain",
  mantle: "Blockchain", mnt: "Blockchain",
  stacks: "Blockchain", stx: "Blockchain",
  cronos: "Blockchain", cro: "Blockchain",
  immutablex: "Blockchain", imx: "Blockchain",
};

export function classifyCoin(coin) {
  if (!coin) return "Blockchain";
  const id = coin.id?.toLowerCase();
  const sym = coin.symbol?.toLowerCase();
  if (id && CATEGORY_MAP[id]) return CATEGORY_MAP[id];
  if (sym && CATEGORY_MAP[sym]) return CATEGORY_MAP[sym];

  // Heuristic fallbacks
  if (sym?.includes("usd") || sym?.endsWith("usd") || id?.includes("usd") || id?.includes("stable")) {
    return "Stablecoin";
  }
  if (sym?.includes("doge") || sym?.includes("cat") || sym?.includes("pepe") || id?.includes("inu")) {
    return "Meme";
  }
  if (sym?.includes("swap") || id?.includes("dao") || id?.includes("finance")) {
    return "DeFi";
  }
  return "Blockchain";
}

/* ------------------------------------------------------------
   Heatmap Color Scale (Deep dark wine red -> Slate -> Deep forest green)
   ------------------------------------------------------------ */
export const HEAT_SCALE = [
  { label: "-6%", color: "#3d1219" },
  { label: "-3%", color: "#34171e" },
  { label: "-1%", color: "#271a22" },
  { label: "0%", color: "#181e26" },
  { label: "+1%", color: "#152a24" },
  { label: "+3%", color: "#153d30" },
  { label: "+6%", color: "#134e3d" },
];

export function getHeatColor(pct, timeframe = "24h") {
  if (pct == null || Number.isNaN(pct)) return "#181e26";
  const mult = timeframe === "1h" ? 2.5 : timeframe === "7d" ? 0.4 : 1;
  const val = pct * mult;
  if (val <= -5) return "#3d1219";
  if (val <= -2) return "#34171e";
  if (val < -0.3) return "#271a22";
  if (val <= 0.3) return "#181e26";
  if (val <= 2) return "#152a24";
  if (val <= 5) return "#153d30";
  return "#134e3d";
}

/* Helper to retrieve price change by selected timeframe */
function getCoinChange(coin, timeframe) {
  if (timeframe === "1h") {
    return coin.price_change_percentage_1h_in_currency ?? (coin.price_change_percentage_24h ? coin.price_change_percentage_24h / 12 : 0);
  }
  if (timeframe === "7d") {
    return coin.price_change_percentage_7d_in_currency ?? (coin.price_change_percentage_24h ? coin.price_change_percentage_24h * 2.5 : 0);
  }
  return coin.price_change_percentage_24h ?? 0;
}

/* ------------------------------------------------------------
   Memoized Treemap Boxes Grid: isolated so tooltip state updates
   never re-render the 45 coin boxes.
   ------------------------------------------------------------ */
const HeatmapBoxes = memo(function HeatmapBoxes({ categories, leaves, timeframe, onBoxEnter, onBoxClick }) {
  return (
    <>
      {/* Category Cluster Labels — only show on major sectors with ample height to prevent overlap */}
      {categories.map((cat) => {
        const isMajor = cat.name === "Currency" || cat.name === "Blockchain" || cat.name === "Stablecoin";
        if (!isMajor || cat.w < 120 || cat.h < 90) return null;
        return (
          <div
            key={cat.name}
            className="hm-cat-label"
            style={{
              left: cat.x0 + 6,
              top: cat.y0 + 2,
              width: Math.max(50, cat.w - 12),
            }}
          >
            {cat.name}
          </div>
        );
      })}

      {/* Coin Boxes */}
      {leaves.map(({ coin, x, y, w, h }) => {
        if (w < 4 || h < 4) return null;
        const chg = getCoinChange(coin, timeframe);
        const up = chg >= 0;
        const color = getHeatColor(chg, timeframe);

        // Responsive typography & layout scaling
        const isLarge = w >= 95 && h >= 60;
        const isMedium = (w >= 52 && h >= 36) || (w >= 78 && h >= 26);
        const isSmall = w >= 30 && h >= 16;
        const isTiny = !isLarge && !isMedium && !isSmall;

        const sym = (coin.symbol || "").toUpperCase();
        const displaySym = sym.length > 5 ? sym.slice(0, 4) : sym;

        return (
          <div
            key={coin.id}
            className="hm-box"
            style={{
              left: x,
              top: y,
              width: w,
              height: h,
              backgroundColor: color,
            }}
            onClick={() => onBoxClick(coin.id)}
            onMouseEnter={(e) => onBoxEnter(coin, e)}
            tabIndex={0}
            role="button"
            aria-label={`${coin.name}: ${fmtPrice(coin.current_price)}, ${fmtPct(chg)}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onBoxClick(coin.id);
              }
            }}
          >
            <div className="hm-box-content">
              {/* Coin logo + symbol row on large and medium tiles */}
              <div className="hm-coin-head">
                {isLarge && coin.image && (
                  <img
                    src={coin.image}
                    alt=""
                    className="hm-coin-ico"
                    width="18"
                    height="18"
                    loading="lazy"
                  />
                )}
                <span
                  className={`hm-sym mono ${isLarge ? "hm-sym-lg" : isMedium ? "hm-sym-md" : isSmall ? "hm-sym-sm" : "hm-sym-xs"}`}
                >
                  {displaySym}
                </span>
              </div>

              {!isTiny && (
                <span
                  className={`hm-pct mono ${up ? "up" : "down"} ${isLarge ? "hm-pct-lg" : isMedium ? "hm-pct-md" : "hm-pct-sm"}`}
                >
                  {fmtPct(chg)}
                </span>
              )}

              {(isLarge || (isMedium && h >= 48)) && (
                <span className="hm-price mono">
                  {fmtPrice(coin.current_price)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
});

/* ------------------------------------------------------------
   Main MarketHeatmap Component
   ------------------------------------------------------------ */
export default function MarketHeatmap({ coins: propCoins, defaultTab }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialTab =
    defaultTab ||
    searchParams.get("tab") ||
    (location.pathname === "/liquidation" || location.hash === "#liquidation" ? "liquidation" : "heatmap");
  const [fetchedCoins, setFetchedCoins] = useState([]);
  const [realtimeCoins, setRealtimeCoins] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab); // "heatmap" | "liquidation"
  const [timeframe, setTimeframe] = useState("24h"); // "1h" | "24h" | "7d"
  const [activeCoin, setActiveCoin] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (location.pathname === "/liquidation" || location.hash === "#liquidation" || searchParams.get("tab") === "liquidation") {
      setActiveTab("liquidation");
    } else if (searchParams.get("tab") === "heatmap" || location.hash === "#heatmap") {
      setActiveTab("heatmap");
    }
  }, [defaultTab, location.pathname, location.hash, searchParams]);

  // Compact height: 350px on desktop for sleek viewport fitting
  const [dims, setDims] = useState({ width: 1180, height: 350 });
  const containerRef = useRef(null);
  const containerRectRef = useRef(null);
  const tooltipRef = useRef(null);
  const lastWidth = useRef(1180);
  const navigate = useNavigate();

  // Initial fetch if mounted standalone without propCoins
  useEffect(() => {
    if (propCoins && propCoins.length > 0) return;
    let cancelled = false;
    getMarkets({ perPage: 60 })
      .then((data) => {
        if (!cancelled && data && data.length) {
          setFetchedCoins(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [propCoins]);

  const baseCoins = propCoins && propCoins.length ? propCoins : fetchedCoins;

  // Real-time live data subscription: throttled to 15s to keep D3 treemap layout silky smooth
  useEffect(() => {
    if (!baseCoins || !baseCoins.length) return;

    let lastTreemapSync = Date.now();
    const unsubscribe = subscribeToRealtimeFeeds((binanceMap) => {
      const now = Date.now();
      if (now - lastTreemapSync < 15_000) return;
      lastTreemapSync = now;

      setRealtimeCoins((prev) => {
        const currentBase = prev && prev.length ? prev : baseCoins;
        const enriched = enrichWithRealtimeData(currentBase, binanceMap);
        setLastSyncTime(now);
        return enriched;
      });
    });

    return () => unsubscribe();
  }, [baseCoins]);

  const coins = realtimeCoins && realtimeCoins.length ? realtimeCoins : baseCoins;

  // Manual fast sync trigger
  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const fresh = await getMarkets({ perPage: 60 });
      if (fresh && fresh.length) {
        setRealtimeCoins(fresh);
        setLastSyncTime(Date.now());
      }
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Debounced, thresholded ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.floor(entry.contentRect.width);
        if (width > 0 && Math.abs(width - lastWidth.current) >= 12) {
          lastWidth.current = width;
          const height = width < 600 ? 260 : width < 900 ? 300 : 350;
          setDims({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute D3 Treemap layout (memoized to active coins & rounded dims)
  const { categories, leaves } = useMemo(() => {
    if (!coins.length || dims.width <= 0) return { categories: [], leaves: [] };

    // Group coins into categories
    const groups = {
      Currency: [],
      Blockchain: [],
      Stablecoin: [],
      Exchange: [],
      DeFi: [],
      Meme: [],
    };

    // Filter top liquid coins to keep DOM lean and fast
    const tracked = coins.slice(0, 45);

    for (const c of tracked) {
      const cat = classifyCoin(c);
      if (groups[cat]) {
        groups[cat].push(c);
      } else {
        groups.Blockchain.push(c);
      }
    }

    // Category priority ordering
    const order = ["Currency", "Blockchain", "Stablecoin", "Exchange", "DeFi", "Meme"];
    const children = order
      .filter((k) => groups[k] && groups[k].length > 0)
      .map((k) => ({
        name: k,
        children: groups[k].map((c) => ({
          ...c,
          category: k,
          value: Math.pow(Math.max(10_000, c.market_cap || 10_000), 0.70),
        })),
      }));

    const rootData = { name: "root", children };

    const root = hierarchy(rootData)
      .sum((d) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Nested treemap: 15px top padding on depth 1 only if major cluster is large enough
    const treemapLayout = treemap()
      .size([dims.width, dims.height])
      .tile(treemapSquarify)
      .paddingTop((d) => {
        if (d.depth !== 1) return 0;
        const name = d.data?.name;
        const isMajor = name === "Currency" || name === "Blockchain" || name === "Stablecoin";
        return (isMajor && d.x1 - d.x0 >= 120 && d.y1 - d.y0 >= 90) ? 15 : 0;
      })
      .paddingInner(2)
      .paddingOuter(1.5)
      .round(true);

    treemapLayout(root);

    // Extract categories (depth 1)
    const catNodes = (root.children || []).map((c) => ({
      name: c.data.name,
      x0: c.x0,
      y0: c.y0,
      x1: c.x1,
      y1: c.y1,
      w: c.x1 - c.x0,
      h: c.y1 - c.y0,
    }));

    // Extract leaves (depth 2 - coins)
    const leafNodes = root.leaves().map((l) => ({
      coin: l.data,
      x: l.x0,
      y: l.y0,
      w: Math.max(0, l.x1 - l.x0),
      h: Math.max(0, l.y1 - l.y0),
    }));

    return { categories: catNodes, leaves: leafNodes };
  }, [coins, dims.width, dims.height]);

  // High-performance zero-re-render tooltip positioning
  const updateTooltipPos = (clientX, clientY) => {
    if (!tooltipRef.current) return;
    if (!containerRectRef.current && containerRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }
    const rect = containerRectRef.current;
    if (!rect) return;
    const x = Math.min(dims.width - 235, Math.max(10, clientX - rect.left + 16));
    const y = Math.min(dims.height - 145, Math.max(10, clientY - rect.top - 40));
    tooltipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const handleMouseEnterBox = (coin, e) => {
    setActiveCoin(coin);
    if (containerRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }
    updateTooltipPos(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (activeCoin) {
      updateTooltipPos(e.clientX, e.clientY);
    }
  };

  const handleMouseLeave = () => {
    setActiveCoin(null);
    containerRectRef.current = null;
    if (tooltipRef.current) {
      tooltipRef.current.style.transform = "translate3d(-9999px, -9999px, 0)";
    }
  };

  const handleBoxClick = (coinId) => {
    navigate(`/coin/${coinId}`);
  };

  const activeCoinChg = activeCoin ? getCoinChange(activeCoin, timeframe) : 0;

  return (
    <section data-reveal className="section heatmap-section" id="heatmap">
      <div className="container">
        {/* ============ HEADER ============ */}
        <div className="heatmap-header">
          <div className="hm-head-left">
            <div className="hm-title-row">
              <h2 className="display hm-title">HeatMap &amp; Liquidation</h2>
            </div>

            <div className="hm-controls">
              {/* Tab Selector */}
              <div className="hm-tabs" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === "heatmap"}
                  className={`hm-tab ${activeTab === "heatmap" ? "active" : ""}`}
                  onClick={() => setActiveTab("heatmap")}
                >
                  Heatmap
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "liquidation"}
                  className={`hm-tab ${activeTab === "liquidation" ? "active" : ""}`}
                  onClick={() => setActiveTab("liquidation")}
                >
                  Liquidation
                </button>
              </div>

              {/* Timeframe Selector */}
              {activeTab === "heatmap" && (
                <div className="hm-tf-tabs" role="group" aria-label="Performance Timeframe">
                  {["1h", "24h", "7d"].map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      className={`hm-tf-btn ${timeframe === tf ? "active" : ""}`}
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="hm-sub">
              Area scales by market capitalization; tile hue reflects live {timeframe.toUpperCase()} price performance.
            </p>
          </div>

          <div className="hm-head-right">
            <Link to="/markets" className="hm-see-all">
              See all markets ↗
            </Link>

            {/* Color Scale Legend */}
            {activeTab === "heatmap" && (
              <div className="hm-legend" aria-label="Performance Color Scale">
                <div className="hm-legend-bars">
                  {HEAT_SCALE.map((step) => (
                    <span
                      key={step.label}
                      className="hm-legend-chip"
                      style={{ background: step.color }}
                      title={step.label}
                    />
                  ))}
                </div>
                <div className="hm-legend-labels">
                  {HEAT_SCALE.map((step) => (
                    <span key={step.label} className="hm-legend-lbl mono">
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ TAB 1: HEATMAP ============ */}
        {activeTab === "heatmap" && (
          <div
            className="heatmap-wrapper"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ minHeight: dims.height }}
          >
            <HeatmapBoxes
              categories={categories}
              leaves={leaves}
              timeframe={timeframe}
              onBoxEnter={handleMouseEnterBox}
              onBoxClick={handleBoxClick}
            />

            {/* Hardware-accelerated hover tooltip */}
            <div
              ref={tooltipRef}
              className={`hm-tooltip ${activeCoin ? "hm-tooltip-visible" : ""}`}
              style={{ transform: "translate3d(-9999px, -9999px, 0)" }}
            >
              {activeCoin && (
                <>
                  <div className="ht-head">
                    <div className="ht-coin-info">
                      {activeCoin.image && (
                        <img src={activeCoin.image} alt="" className="ht-coin-img" width="22" height="22" />
                      )}
                      <div>
                        <span className="ht-sym mono">{activeCoin.symbol?.toUpperCase()}</span>
                        <span className="ht-name">{activeCoin.name}</span>
                      </div>
                    </div>
                    <span
                      className={`ht-chg mono ${activeCoinChg >= 0 ? "up" : "down"}`}
                    >
                      {activeCoinChg >= 0 ? "↗" : "↘"}{" "}
                      {fmtPct(activeCoinChg)}
                    </span>
                  </div>
                  <div className="ht-data">
                    <div className="ht-row">
                      <span className="ht-lbl">Live Price</span>
                      <span className="ht-val mono">{fmtPrice(activeCoin.current_price)}</span>
                    </div>
                    <div className="ht-row">
                      <span className="ht-lbl">24h Volume</span>
                      <span className="ht-val mono">{fmtCompact(activeCoin.total_volume)}</span>
                    </div>
                    <div className="ht-row">
                      <span className="ht-lbl">Market Cap</span>
                      <span className="ht-val mono">{fmtCompact(activeCoin.market_cap)}</span>
                    </div>
                  </div>
                  <div className="ht-foot">
                    <span className="ht-cat">{activeCoin.category || classifyCoin(activeCoin)}</span>
                    <span className="ht-source">Live Feed</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============ TAB 2: LIQUIDATION OVERVIEW ============ */}
        {activeTab === "liquidation" && (
          <div className="liquidation-card glass">
            <div className="liq-head">
              <div className="liq-stat liq-stat-total">
                <span className="liq-lbl">Total 24h Liquidations</span>
                <span className="liq-val mono gradient-text">$248.62M</span>
                <span className="delta down">▼ 11.4% vs yesterday</span>
              </div>
              <div className="liq-stat liq-stat-long">
                <span className="liq-lbl">Long Liquidations</span>
                <span className="liq-val mono" style={{ color: "var(--down)" }}>$158.12M</span>
                <span className="liq-sub mono">63.6% of total</span>
              </div>
              <div className="liq-stat liq-stat-short">
                <span className="liq-lbl">Short Liquidations</span>
                <span className="liq-val mono" style={{ color: "var(--up)" }}>$90.50M</span>
                <span className="liq-sub mono">36.4% of total</span>
              </div>
            </div>

            {/* Ratio bar */}
            <div className="liq-bar-wrap">
              <div className="liq-bar">
                <div className="liq-fill-long" style={{ width: "63.6%" }} title="Longs: 63.6%" />
                <div className="liq-fill-short" style={{ width: "36.4%" }} title="Shorts: 36.4%" />
              </div>
              <div className="liq-bar-labels mono">
                <span style={{ color: "var(--down)" }}>Longs $158.1M (63.6%)</span>
                <span style={{ color: "var(--up)" }}>Shorts $90.5M (36.4%)</span>
              </div>
            </div>

            {/* Asset Breakdown */}
            <div className="liq-table-wrap">
              <div className="liq-table-head mono">
                <span>Asset</span>
                <span className="num">24h Total</span>
                <span className="num">Longs</span>
                <span className="num">Shorts</span>
                <span className="num">Largest Order</span>
              </div>
              {[
                { sym: "BTC", total: "$84.2M", longs: "$56.1M", shorts: "$28.1M", max: "$4.18M (Binance)" },
                { sym: "ETH", total: "$52.8M", longs: "$34.4M", shorts: "$18.4M", max: "$2.95M (OKX)" },
                { sym: "SOL", total: "$28.1M", longs: "$19.6M", shorts: "$8.5M", max: "$1.40M (Bybit)" },
                { sym: "DOGE", total: "$14.6M", longs: "$11.2M", shorts: "$3.4M", max: "$980K (Binance)" },
                { sym: "XRP", total: "$11.9M", longs: "$7.8M", shorts: "$4.1M", max: "$650K (Bybit)" },
                { sym: "SUI", total: "$8.4M", longs: "$5.9M", shorts: "$2.5M", max: "$420K (Binance)" },
              ].map((row) => (
                <div className="liq-row mono" key={row.sym}>
                  <span className="liq-sym">{row.sym}</span>
                  <span className="num">{row.total}</span>
                  <span className="num" style={{ color: "var(--down)" }}>{row.longs}</span>
                  <span className="num" style={{ color: "var(--up)" }}>{row.shorts}</span>
                  <span className="num" style={{ color: "var(--text-dim)" }}>{row.max}</span>
                </div>
              ))}
            </div>

            <div className="liq-footer">
              <button className="btn btn-ghost" onClick={() => setActiveTab("heatmap")}>
                ← Back to Heatmap
              </button>
              <Link to="/markets" className="btn btn-primary">
                Explore All Markets →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
