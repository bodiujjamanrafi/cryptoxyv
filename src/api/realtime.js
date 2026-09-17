/* ============================================================
   Realtime Multi-Source Data Layer
   Pulls live ticker feeds from trusted institutional sources:
   - CoinGecko API: comprehensive market ranks, categories, supply, logos
   - Binance Global API & WebSocket: millisecond real-time prices, 24h % delta, volume
   ============================================================ */

const BINANCE_HTTP_PRIMARY = "https://api.binance.com/api/v3/ticker/24hr";
const BINANCE_HTTP_FALLBACK = "https://data-api.binance.vision/api/v3/ticker/24hr";
const BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/!miniTicker@arr";

// Cache in-memory
let lastBinanceFetchTime = 0;
let cachedBinanceMap = new Map();
let isFetchingBinance = false;

/* Normalise symbols for reliable matching (e.g. BTC -> BTCUSDT) */
export function getBinanceSymbolKey(sym) {
  if (!sym) return "";
  const s = sym.toUpperCase();
  if (s === "USDT") return "USDCUSDT";
  if (s === "USDC") return "USDCUSDT";
  if (s === "SHIB") return "1000SHIBUSDT";
  if (s === "PEPE") return "1000PEPEUSDT";
  if (s === "BONK") return "1000BONKUSDT";
  if (s === "FLOKI") return "1000FLOKIUSDT";
  return `${s}USDT`;
}

/* Fetch 24hr tickers from Binance API */
export async function fetchBinanceTickers() {
  const now = Date.now();
  if (cachedBinanceMap.size > 0 && now - lastBinanceFetchTime < 6000) {
    return cachedBinanceMap;
  }
  if (isFetchingBinance && cachedBinanceMap.size > 0) {
    return cachedBinanceMap;
  }

  isFetchingBinance = true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    let res;
    try {
      res = await fetch(BINANCE_HTTP_PRIMARY, { signal: controller.signal });
    } catch {
      res = await fetch(BINANCE_HTTP_FALLBACK, { signal: controller.signal });
    }

    if (res && res.ok) {
      const data = await res.json();
      const map = new Map();
      for (const item of data) {
        if (item.symbol && item.symbol.endsWith("USDT")) {
          const price = parseFloat(item.lastPrice);
          const chg = parseFloat(item.priceChangePercent);
          const vol = parseFloat(item.quoteVolume);
          const high = parseFloat(item.highPrice);
          const low = parseFloat(item.lowPrice);
          if (!Number.isNaN(price) && price > 0) {
            map.set(item.symbol, { price, chg, vol, high, low, t: now });
          }
        }
      }
      cachedBinanceMap = map;
      lastBinanceFetchTime = now;
    }
  } catch (err) {
    // Network timeout or blocked — keep previous cache
  } finally {
    clearTimeout(timer);
    isFetchingBinance = false;
  }

  return cachedBinanceMap;
}

/* Merge live Binance real-time pricing onto CoinGecko coin list */
export function enrichWithRealtimeData(coins, binanceMap) {
  if (!coins || !coins.length) return [];
  if (!binanceMap || binanceMap.size === 0) return coins;

  return coins.map((c) => {
    const key = getBinanceSymbolKey(c.symbol);
    const live = binanceMap.get(key);
    if (!live) return c;

    // Handle 1000x meme pairs like 1000PEPE or 1000SHIB
    let livePrice = live.price;
    if (key.startsWith("1000") && c.current_price < livePrice / 100) {
      livePrice = livePrice / 1000;
    }

    const currentPrice = livePrice;
    const priceChange24h = live.chg;

    // Recalculate market cap if circulating supply is known
    let marketCap = c.market_cap;
    if (c.circulating_supply && c.circulating_supply > 0) {
      marketCap = c.circulating_supply * currentPrice;
    } else if (c.current_price && c.current_price > 0 && c.market_cap) {
      marketCap = (c.market_cap / c.current_price) * currentPrice;
    }

    return {
      ...c,
      current_price: currentPrice,
      price_change_percentage_24h: priceChange24h,
      total_volume: Math.max(c.total_volume || 0, live.vol || 0),
      high_24h: live.high || c.high_24h,
      low_24h: live.low || c.low_24h,
      isRealtime: true,
      lastRealtimeUpdate: live.t,
    };
  });
}

// Shared singleton state for all-coin feeds
const feedSubscribers = new Set();
let sharedFeedWs = null;
let sharedFeedIntervalId = null;
let sharedThrottleTimer = null;
let sharedLastEmitTime = 0;

function broadcastFeedTick(map) {
  feedSubscribers.forEach((cb) => {
    try {
      cb(map);
    } catch {
      // ignore subscriber error
    }
  });
}

function emitSharedThrottled() {
  if (feedSubscribers.size === 0) return;
  // If tab is in background, don't waste CPU emitting updates
  if (typeof document !== "undefined" && document.hidden) return;

  const now = Date.now();
  const elapsed = now - sharedLastEmitTime;
  if (elapsed >= 3500) {
    if (sharedThrottleTimer) {
      clearTimeout(sharedThrottleTimer);
      sharedThrottleTimer = null;
    }
    sharedLastEmitTime = now;
    broadcastFeedTick(new Map(cachedBinanceMap));
  } else if (!sharedThrottleTimer) {
    sharedThrottleTimer = setTimeout(() => {
      sharedThrottleTimer = null;
      if (feedSubscribers.size > 0) {
        sharedLastEmitTime = Date.now();
        broadcastFeedTick(new Map(cachedBinanceMap));
      }
    }, 3500 - elapsed);
  }
}

async function pollSharedHttp() {
  const map = await fetchBinanceTickers();
  if (feedSubscribers.size > 0 && map.size > 0) {
    sharedLastEmitTime = Date.now();
    broadcastFeedTick(map);
  }
}

function initSharedFeedWs() {
  if (sharedFeedWs || typeof WebSocket === "undefined") return;

  try {
    sharedFeedWs = new WebSocket(BINANCE_WS_URL);

    sharedFeedWs.onopen = () => {
      // If WebSocket connected cleanly, stop HTTP polling fallback
      if (sharedFeedIntervalId) {
        clearInterval(sharedFeedIntervalId);
        sharedFeedIntervalId = null;
      }
    };

    sharedFeedWs.onmessage = (event) => {
      if (feedSubscribers.size === 0) return;
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const arr = JSON.parse(event.data);
        if (Array.isArray(arr)) {
          const now = Date.now();
          for (const item of arr) {
            if (item.s && item.s.endsWith("USDT")) {
              const price = parseFloat(item.c);
              const open = parseFloat(item.o);
              const chg = open > 0 ? ((price - open) / open) * 100 : 0;
              const vol = parseFloat(item.q);
              if (price > 0) {
                cachedBinanceMap.set(item.s, {
                  price,
                  chg,
                  vol,
                  high: parseFloat(item.h),
                  low: parseFloat(item.l),
                  t: now,
                });
              }
            }
          }
          emitSharedThrottled();
        }
      } catch {
        // parsing error
      }
    };

    sharedFeedWs.onerror = () => {
      if (!sharedFeedIntervalId && feedSubscribers.size > 0) {
        sharedFeedIntervalId = setInterval(pollSharedHttp, 10000);
      }
    };

    sharedFeedWs.onclose = () => {
      sharedFeedWs = null;
      if (feedSubscribers.size > 0 && !sharedFeedIntervalId) {
        sharedFeedIntervalId = setInterval(pollSharedHttp, 10000);
      }
    };
  } catch {
    sharedFeedWs = null;
    if (!sharedFeedIntervalId) {
      sharedFeedIntervalId = setInterval(pollSharedHttp, 10000);
    }
  }

  // Initial immediate fetch for instant paint
  pollSharedHttp();
}

function cleanupSharedFeedWsIfIdle() {
  if (feedSubscribers.size === 0) {
    if (sharedThrottleTimer) {
      clearTimeout(sharedThrottleTimer);
      sharedThrottleTimer = null;
    }
    if (sharedFeedIntervalId) {
      clearInterval(sharedFeedIntervalId);
      sharedFeedIntervalId = null;
    }
    if (sharedFeedWs) {
      if (sharedFeedWs.readyState === WebSocket.OPEN) {
        sharedFeedWs.close();
      } else if (sharedFeedWs.readyState === WebSocket.CONNECTING) {
        sharedFeedWs.onopen = () => {
          try { sharedFeedWs.close(); } catch { /* ignore */ }
          sharedFeedWs = null;
        };
      }
      sharedFeedWs = null;
    }
  }
}

/* Connect to Binance WebSocket for instant live price streams across all coins (singleton) */
export function subscribeToRealtimeFeeds(onTick) {
  if (!onTick) return () => {};

  feedSubscribers.add(onTick);

  // If we have cached data, deliver it immediately to new subscriber
  if (cachedBinanceMap.size > 0) {
    onTick(new Map(cachedBinanceMap));
  }

  // Start shared WebSocket if this is the first listener
  if (feedSubscribers.size === 1) {
    initSharedFeedWs();
  }

  return () => {
    feedSubscribers.delete(onTick);
    cleanupSharedFeedWsIfIdle();
  };
}

/* Connect to Binance WebSocket for a SPECIFIC coin:
   Receives throttled live ticker updates + live trade executions.
   Returns unsubscribe callback. */
export function subscribeCoinTicker(rawSymbol, { onTicker, onTrade, onStatus } = {}) {
  const pair = getBinanceSymbolKey(rawSymbol);
  if (!pair) return () => {};

  const streamPair = pair.toLowerCase();
  // Only subscribe to trade stream if onTrade handler was actually provided
  const streams = onTrade
    ? `${streamPair}@ticker/${streamPair}@trade`
    : `${streamPair}@ticker`;
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

  let ws = null;
  let intervalId = null;
  let isClosed = false;

  let lastTickerEmit = 0;
  let tickerThrottleTimer = null;

  const emitThrottledTicker = (tickerObj) => {
    if (isClosed || !onTicker) return;
    const now = Date.now();
    const elapsed = now - lastTickerEmit;
    if (elapsed >= 1000) {
      if (tickerThrottleTimer) {
        clearTimeout(tickerThrottleTimer);
        tickerThrottleTimer = null;
      }
      lastTickerEmit = now;
      onTicker(tickerObj);
    } else if (!tickerThrottleTimer) {
      tickerThrottleTimer = setTimeout(() => {
        tickerThrottleTimer = null;
        if (!isClosed && onTicker) {
          lastTickerEmit = Date.now();
          onTicker(tickerObj);
        }
      }, 1000 - elapsed);
    }
  };

  const pollSingleHttp = async () => {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
      if (res.ok) {
        const item = await res.json();
        const price = parseFloat(item.lastPrice);
        const chg = parseFloat(item.priceChangePercent);
        const chgVal = parseFloat(item.priceChange);
        const high = parseFloat(item.highPrice);
        const low = parseFloat(item.lowPrice);
        const quoteVol = parseFloat(item.quoteVolume);
        const baseVol = parseFloat(item.volume);
        const bid = parseFloat(item.bidPrice);
        const ask = parseFloat(item.askPrice);
        const numTrades = item.count;
        if (price > 0 && !isClosed && onTicker) {
          emitThrottledTicker({
            symbol: pair,
            price,
            chg,
            chgVal,
            high,
            low,
            quoteVol,
            baseVol,
            bid,
            ask,
            tradesCount: numTrades,
            isRealtime: true,
            t: Date.now(),
          });
        }
      }
    } catch {
      // ignore
    }
  };

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      if (!isClosed && onStatus) onStatus("connected");
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    ws.onmessage = (event) => {
      if (isClosed) return;
      try {
        const msg = JSON.parse(event.data);
        const stream = msg.stream;
        const d = msg.data;
        if (!d) return;

        if (stream && stream.endsWith("@ticker")) {
          const price = parseFloat(d.c);
          const chg = parseFloat(d.P);
          const chgVal = parseFloat(d.p);
          const high = parseFloat(d.h);
          const low = parseFloat(d.l);
          const quoteVol = parseFloat(d.q);
          const baseVol = parseFloat(d.v);
          const bid = parseFloat(d.b);
          const ask = parseFloat(d.a);
          const tradesCount = d.n;

          if (price > 0 && onTicker) {
            emitThrottledTicker({
              symbol: pair,
              price,
              chg,
              chgVal,
              high,
              low,
              quoteVol,
              baseVol,
              bid,
              ask,
              tradesCount,
              isRealtime: true,
              t: d.E || Date.now(),
            });
          }
        } else if (stream && stream.endsWith("@trade")) {
          const price = parseFloat(d.p);
          const qty = parseFloat(d.q);
          const time = d.T || Date.now();
          const isBuyerMaker = d.m;
          const side = isBuyerMaker ? "sell" : "buy";

          if (price > 0 && onTrade) {
            onTrade({
              id: d.t || `${time}-${Math.random()}`,
              price,
              qty,
              time,
              side,
            });
          }
        }
      } catch {
        // json parse error
      }
    };

    ws.onerror = () => {
      if (!isClosed && onStatus) onStatus("fallback");
      if (!intervalId) intervalId = setInterval(pollSingleHttp, 6000);
    };

    ws.onclose = () => {
      if (!isClosed && onStatus) onStatus("reconnecting");
      if (!isClosed && !intervalId) intervalId = setInterval(pollSingleHttp, 6000);
    };
  } catch {
    if (onStatus) onStatus("fallback");
    intervalId = setInterval(pollSingleHttp, 6000);
  }

  // Initial immediate fetch for instant paint
  pollSingleHttp();

  return () => {
    isClosed = true;
    if (tickerThrottleTimer) clearTimeout(tickerThrottleTimer);
    if (intervalId) clearInterval(intervalId);
    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => {
          try { ws.close(); } catch { /* ignore */ }
        };
      }
    }
  };
}
