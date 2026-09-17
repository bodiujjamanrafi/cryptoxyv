import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import Sparkline from "./Sparkline";
import { fmtPrice, fmtCompact, fmtPct } from "../api/coingecko";
import "./CoinTable.css";

/* Exact Verified Seal from TokenScannerBox */
function Verified() {
  return (
    <span className="scanner-row-verified">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#eab308">
        <path d="M12 2l2.4 2.1 3.2-.4 1.1 3 2.9 1.4-.7 3.1 1.9 2.6-2 2.5.4 3.2-3.1 1.1-1.4 2.9-3.1-.7-2.6 1.9-2.5-2-3.2.4-1.1-3-2.9-1.4.7-3.1-1.9-2.6 2-2.5-.4-3.2 3.1-1.1 1.4-2.9 3.1.7L12 2z" />
        <path
          d="M8.5 12.5l2.5 2.5 5-5"
          fill="none"
          stroke="#15171c"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* Frameless 24h % Data */
function DeltaChip({ value }) {
  if (value == null || Number.isNaN(Number(value))) return <span className="mono" style={{ color: "rgba(255,255,255,0.3)" }}>—</span>;
  const num = Number(value);
  const up = num >= 0;
  return (
    <span className={`mono ${up ? "scanner-pill-green" : "scanner-pill-red"}`}>
      {up ? "▲ " : "▼ "}
      {Math.abs(num).toFixed(2)}%
    </span>
  );
}

function compact(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return Math.round(n).toLocaleString("en-US");
}

const COLS = [
  { label: "#", num: false, cls: "hide-sm ch-rank" },
  { label: "Token", num: false, cls: "ch-token" },
  { label: "Price", num: true, cls: "ch-price" },
  { label: "24h %", num: true, cls: "ch-24h" },
  { label: "Market Cap", num: true, cls: "hide-md ch-mcap" },
  { label: "24h Volume", num: true, cls: "hide-md ch-vol" },
  { label: "Circ. Supply", num: true, cls: "hide-md ch-supply" },
  { label: "Last 7 Days", num: false, cls: "hide-sm ch-spark" },
];

/* Single Coin Row with TokenScannerBox aesthetics & smooth playback */
const CoinRow = memo(function CoinRow({ coin, index, liveTick, onNavigate }) {
  const sym = coin.symbol?.toUpperCase();
  const currentPrice = liveTick?.price ?? coin.current_price;
  const change24 = liveTick?.chg ?? coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h;

  const [priceFlash, setPriceFlash] = useState(null);
  const prevPriceRef = useRef(currentPrice);

  useEffect(() => {
    if (prevPriceRef.current && currentPrice && prevPriceRef.current !== currentPrice) {
      if (currentPrice > prevPriceRef.current) {
        setPriceFlash("up");
      } else if (currentPrice < prevPriceRef.current) {
        setPriceFlash("down");
      }
      const t = setTimeout(() => setPriceFlash(null), 900);
      prevPriceRef.current = currentPrice;
      return () => clearTimeout(t);
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  const up7 = (coin.price_change_percentage_7d_in_currency ?? change24 ?? 0) >= 0;

  const circSupply = coin.circulating_supply;
  const maxSupply = coin.max_supply || coin.total_supply;
  const circPct =
    circSupply && maxSupply
      ? Math.min(100, Math.max(10, Math.round((circSupply / maxSupply) * 100)))
      : 88;

  const displayRank = index != null ? index + 1 : (coin.market_cap_rank ?? "—");

  return (
    <div
      role="row"
      className="ctable-scanner-row"
      onClick={() => onNavigate(`/coin/${coin.id}`)}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onNavigate(`/coin/${coin.id}`)}
    >
      {/* Rank Badge */}
      <div className="cell cell-rank hide-sm">
        <span className="scanner-rank-badge mono">#{displayRank}</span>
      </div>

      {/* Left: Token Logo, Name, Verified Badge, Symbol */}
      <div className="scanner-cell-coin cell-token">
        <div className="scanner-coin-logo-wrap">
          {coin.image ? (
            <img src={coin.image} alt={coin.name} loading="lazy" />
          ) : (
            <div className="scanner-row-logo-fallback">{sym?.slice(0, 2) || "TK"}</div>
          )}
        </div>
        <span className="scanner-coin-name">{coin.name}</span>
        <Verified />
        <span className="scanner-coin-sym mono">{sym}</span>
      </div>

      {/* Realtime Streaming Price */}
      <div
        className={`scanner-cell-price cell-price mono ${
          priceFlash === "up" ? "flash-up" : priceFlash === "down" ? "flash-down" : ""
        }`}
      >
        {fmtPrice(currentPrice)}
      </div>

      {/* 24h Delta Pill (matching scanner pills) */}
      <div className="cell num cell-24h">
        <DeltaChip value={change24} />
      </div>

      {/* Market Cap */}
      <div className="cell num mono cell-mcap" style={{ color: "rgba(255, 255, 255, 0.82)", fontSize: "13px" }}>
        {fmtCompact(coin.market_cap)}
      </div>

      {/* 24h Volume */}
      <div className="cell num mono cell-vol" style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "13px" }}>
        {fmtCompact(liveTick?.vol ? liveTick.vol : coin.total_volume)}
      </div>

      {/* Circulating Supply & Visual Micro-Bar */}
      <div className="cell cell-supply">
        <div className="scanner-supply-stack">
          <span className="scanner-supply-val mono">
            {compact(circSupply)} <span className="scanner-supply-sym">{sym}</span>
          </span>
          <div className="scanner-supply-bar-track" title={`${circPct}% circulating supply`}>
            <div className="scanner-supply-bar-fill" style={{ width: `${circPct}%` }} />
          </div>
        </div>
      </div>

      {/* 7-Day Trendline Sparkline with Beacon */}
      <div className="cell spark cell-spark">
        <Sparkline data={coin.sparkline_in_7d?.price} up={up7} width={138} height={40} />
      </div>
    </div>
  );
});

const CoinTable = memo(function CoinTable({ coins = [], realtimeMap = null }) {
  const nav = useNavigate();
  const scrollWrapRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);

  useEffect(() => {
    const el = scrollWrapRef.current;
    if (!el) return;
    const handleScroll = () => {
      const next = el.scrollLeft <= 3;
      setIsAtStart((prev) => (prev === next ? prev : next));
    };
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [coins]);

  const handleNavigate = (url) => {
    nav(url);
  };

  return (
    <div className="ctable-inner-box">
      <div
        className={`ctable-scroll-wrap ${isAtStart ? "at-scroll-start" : "is-scrolled"}`}
        ref={scrollWrapRef}
      >
        {/* Column Headers */}
        <div className="ctable-scanner-head">
          {COLS.map((c) => (
            <div key={c.label} className={`ch ${c.num ? "num" : ""} ${c.cls || ""}`}>
              {c.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {coins.map((c, i) => {
          const sym = c.symbol?.toUpperCase();
          const pairKey = sym === "USDT" ? "USDT" : `${sym}USDT`;
          const liveTick = realtimeMap?.get ? realtimeMap.get(pairKey) : null;

          return (
            <CoinRow
              key={c.id ? `${c.id}-${i}` : i}
              coin={c}
              index={i}
              liveTick={liveTick}
              onNavigate={handleNavigate}
            />
          );
        })}
      </div>
    </div>
  );
});

export default CoinTable;
