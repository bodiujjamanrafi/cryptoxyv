import { useState, useMemo } from "react";
import { fmtPrice } from "../api/coingecko";

const CURRENCIES = [
  { id: "usd", symbol: "$", label: "USD", name: "US Dollar" },
  { id: "eur", symbol: "€", label: "EUR", name: "Euro" },
  { id: "gbp", symbol: "£", label: "GBP", name: "British Pound" },
  { id: "btc", symbol: "₿", label: "BTC", name: "Bitcoin" },
  { id: "eth", symbol: "Ξ", label: "ETH", name: "Ethereum" },
];

export default function CoinConverter({ coin, livePrice = null }) {
  const [amountCoin, setAmountCoin] = useState("1");
  const [selectedCur, setSelectedCur] = useState("usd");
  const [lastEdited, setLastEdited] = useState("coin"); // 'coin' | 'target'
  const [amountTarget, setAmountTarget] = useState("");

  const symbol = (coin?.symbol || "").toUpperCase();
  const name = coin?.name || "Coin";
  const prices = coin?.market_data?.current_price || {};

  // Rate of target currency against USD, or direct from prices
  const rateUsd = livePrice || prices.usd || 1;

  const targetRate = useMemo(() => {
    if (selectedCur === "usd") return rateUsd;
    if (prices[selectedCur]) {
      // Direct price in target currency
      return prices[selectedCur];
    }
    // Approximation if target currency not directly in prices
    return rateUsd;
  }, [selectedCur, rateUsd, prices]);

  // Sync inputs
  const displayTarget = useMemo(() => {
    if (lastEdited === "target") return amountTarget;
    const n = parseFloat(amountCoin);
    if (Number.isNaN(n) || n < 0) return "";
    const res = n * targetRate;
    if (res === 0) return "0";
    if (res >= 1) return res.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return res.toFixed(6);
  }, [amountCoin, targetRate, lastEdited, amountTarget]);

  const displayCoin = useMemo(() => {
    if (lastEdited === "coin") return amountCoin;
    const n = parseFloat(amountTarget);
    if (Number.isNaN(n) || n < 0 || targetRate === 0) return "";
    const res = n / targetRate;
    if (res === 0) return "0";
    if (res >= 1) return res.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return res.toFixed(6);
  }, [amountTarget, targetRate, lastEdited, amountCoin]);

  const setCoinVal = (val) => {
    setLastEdited("coin");
    setAmountCoin(val);
  };

  const setTargetVal = (val) => {
    setLastEdited("target");
    setAmountTarget(val);
  };

  const presets = [1, 5, 10, 25, 100];

  return (
    <div className="converter-card glass">
      <div className="converter-head">
        <div>
          <h3 className="rail-title" style={{ marginBottom: 4 }}>Live Converter</h3>
          <span className="converter-rate-label mono">
            1 {symbol} ≈ {selectedCur === "usd" ? fmtPrice(targetRate) : `${targetRate.toLocaleString()} ${selectedCur.toUpperCase()}`}
          </span>
        </div>
      </div>

      <div className="converter-body">
        {/* Coin input */}
        <div className="converter-field">
          <label className="converter-label">You pay / hold</label>
          <div className="converter-input-wrap">
            <input
              type="number"
              className="converter-input mono"
              value={displayCoin}
              onChange={(e) => setCoinVal(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
            />
            <div className="converter-tag mono">
              {coin?.image?.small && <img src={coin.image.small} alt="" width="20" height="20" />}
              <span>{symbol}</span>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="converter-presets">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className={`converter-preset-btn ${parseFloat(displayCoin) === p ? "active" : ""}`}
              onClick={() => setCoinVal(String(p))}
            >
              {p} {symbol}
            </button>
          ))}
        </div>

        {/* Swap / Equals divider */}
        <div className="converter-divider">
          <span className="converter-div-line" />
          <span className="converter-div-icon">⇄</span>
          <span className="converter-div-line" />
        </div>

        {/* Target Currency Input */}
        <div className="converter-field">
          <label className="converter-label">Converted value</label>
          <div className="converter-input-wrap">
            <input
              type="number"
              className="converter-input mono"
              value={displayTarget}
              onChange={(e) => setTargetVal(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
            />
            <select
              className="converter-select mono"
              value={selectedCur}
              onChange={(e) => setSelectedCur(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
