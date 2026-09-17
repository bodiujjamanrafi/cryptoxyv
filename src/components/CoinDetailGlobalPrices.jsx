import { useState, useEffect, useMemo } from "react";
import { fmtPct, fmtNum, getExchangeRates } from "../api/coingecko";

export default function CoinDetailGlobalPrices({ coin, currentPrice, isCompact = false }) {
  const [rates, setRates] = useState(null);

  const name = coin?.name || "Bitcoin";
  const sym = (coin?.symbol || "BTC").toUpperCase();
  const livePriceUsd = currentPrice || coin?.market_data?.current_price?.usd || 77500;
  const chg24 = coin?.market_data?.price_change_percentage_24h || 0;
  const volUsd = coin?.market_data?.total_volume?.usd || 20500000000;
  const high24Usd = coin?.market_data?.high_24h?.usd || livePriceUsd * 1.015;
  const low24Usd = coin?.market_data?.low_24h?.usd || livePriceUsd * 0.985;

  useEffect(() => {
    let cancelled = false;
    getExchangeRates()
      .then((data) => {
        if (!cancelled && data?.rates) {
          setRates(data.rates);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const currencies = useMemo(() => {
    // Standard fiat currencies and symbols
    const list = [
      { code: "USD", name: "US Dollar", symbol: "$", fallbackRate: 1.0 },
      { code: "EUR", name: "Euro", symbol: "€", fallbackRate: 0.92 },
      { code: "GBP", name: "British Pound", symbol: "£", fallbackRate: 0.78 },
      { code: "JPY", name: "Japanese Yen", symbol: "¥", fallbackRate: 154.5 },
      { code: "CAD", name: "Canadian Dollar", symbol: "CA$", fallbackRate: 1.38 },
      { code: "AUD", name: "Australian Dollar", symbol: "A$", fallbackRate: 1.52 },
      { code: "CHF", name: "Swiss Franc", symbol: "CHF", fallbackRate: 0.89 },
      { code: "CNY", name: "Chinese Yuan", symbol: "¥", fallbackRate: 7.25 },
      { code: "INR", name: "Indian Rupee", symbol: "₹", fallbackRate: 84.1 },
      { code: "KRW", name: "South Korean Won", symbol: "₩", fallbackRate: 1380.0 },
      { code: "BRL", name: "Brazilian Real", symbol: "R$", fallbackRate: 5.65 },
      { code: "ETH", name: "Ether", symbol: "Ξ", fallbackRate: 1 / 2500 },
    ];

    // Calculate conversion rate relative to USD:
    // CoinGecko /exchange_rates gives rates relative to BTC (value = how many units of currency = 1 BTC)
    // If rates are present, btcRate = rates.btc.value (1.0), usdRate = rates.usd.value
    const btcUsd = rates?.usd?.value || livePriceUsd;

    return list.map((c) => {
      let multiplier = c.fallbackRate;
      if (rates && rates[c.code.toLowerCase()]) {
        const rateAgainstBtc = rates[c.code.toLowerCase()].value;
        multiplier = rateAgainstBtc / btcUsd;
      }

      const price = livePriceUsd * multiplier;
      const high = high24Usd * multiplier;
      const low = low24Usd * multiplier;
      const vol = volUsd * multiplier;

      return {
        ...c,
        price,
        high,
        low,
        vol,
      };
    });
  }, [rates, livePriceUsd, high24Usd, low24Usd, volUsd]);

  if (isCompact) {
    return (
      <div className="cg-global-prices-compact-card">
        <div className="cg-gp-head">
          <div className="cg-gp-title-wrap">
            <span className="cg-gp-icon">🌐</span>
            <span className="cg-gp-title font-semibold">Global {name} Prices</span>
          </div>
          <span className="cg-badge-live">12 Currencies</span>
        </div>

        <div className="cg-gp-compact-table-wrap">
          <table className="cg-gp-compact-table">
            <thead>
              <tr>
                <th>Currency</th>
                <th className="text-right">Price</th>
                <th className="text-right">24h</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((curr) => {
                const isCrypto = curr.code === "ETH";
                const formattedPrice = isCrypto
                  ? `${curr.price.toFixed(4)} ETH`
                  : `${curr.symbol} ${curr.price >= 100 ? fmtNum(Math.round(curr.price)) : curr.price.toFixed(2)}`;
                const isPos = chg24 >= 0;

                return (
                  <tr key={curr.code} className="cg-gp-compact-row">
                    <td>
                      <div className="cg-gp-currency-name">
                        <span className="mono font-semibold text-light">{curr.code}</span>
                        <span className="cg-gp-symbol-pill mono">{curr.symbol}</span>
                      </div>
                    </td>
                    <td className="text-right mono font-semibold text-light">
                      {formattedPrice}
                    </td>
                    <td className={`text-right mono font-semibold ${isPos ? "text-positive" : "text-negative"}`}>
                      {fmtPct(chg24)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="cg-sec-block" id="global-prices">
      <div className="cg-sec-header-row">
        <div>
          <h2 className="cg-sec-title">Global {name} Prices</h2>
          <span className="cg-sec-sub">Real-time localized exchange rates across major fiat & crypto pairs</span>
        </div>
      </div>

      <div className="cg-table-responsive-wrapper">
        <table className="cg-data-table">
          <thead>
            <tr>
              <th>Currency</th>
              <th className="text-right">Price</th>
              <th className="text-right">24h Change</th>
              <th className="text-right">24h Low</th>
              <th className="text-right">24h High</th>
              <th className="text-right">24h Volume</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((curr) => {
              const isCrypto = curr.code === "ETH" || curr.code === "BTC";
              const formattedPrice = isCrypto
                ? `${curr.price.toFixed(4)} ${curr.code}`
                : `${curr.symbol} ${curr.price >= 100 ? fmtNum(Math.round(curr.price)) : curr.price.toFixed(2)}`;

              const formattedLow = isCrypto
                ? `${curr.low.toFixed(4)} ${curr.code}`
                : `${curr.symbol} ${curr.low >= 100 ? fmtNum(Math.round(curr.low)) : curr.low.toFixed(2)}`;

              const formattedHigh = isCrypto
                ? `${curr.high.toFixed(4)} ${curr.code}`
                : `${curr.symbol} ${curr.high >= 100 ? fmtNum(Math.round(curr.high)) : curr.high.toFixed(2)}`;

              const formattedVol = isCrypto
                ? `${fmtNum(Math.round(curr.vol))} ${curr.code}`
                : `${curr.symbol} ${fmtNum(Math.round(curr.vol))}`;

              return (
                <tr key={curr.code} className="cg-data-row">
                  <td>
                    <div className="cg-curr-cell">
                      <span className="cg-curr-code font-semibold">{curr.code}</span>
                      <span className="cg-curr-name text-muted">({curr.name})</span>
                    </div>
                  </td>
                  <td className="text-right mono font-semibold text-white">{formattedPrice}</td>
                  <td className={`text-right mono ${chg24 >= 0 ? "text-positive" : "text-negative"}`}>
                    {fmtPct(chg24)}
                  </td>
                  <td className="text-right mono text-muted">{formattedLow}</td>
                  <td className="text-right mono text-muted">{formattedHigh}</td>
                  <td className="text-right mono">{formattedVol}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
