/* ============================================================
   CoinGecko data layer
   Public API (no key required). CORS-enabled for the browser.
   Adds a tiny TTL cache + graceful error handling so the UI
   stays smooth and stays inside the free-tier rate limits.
   ============================================================ */

import { FALLBACK_GLOBAL, FALLBACK_COINS, FALLBACK_TRENDING } from "./fallbackData";
import { fetchBinanceTickers, enrichWithRealtimeData } from "./realtime";

const BASE = "https://api.coingecko.com/api/v3";
const LS_PREFIX = "cxv:"; // localStorage key prefix for the disk cache

// in-memory response cache: key -> { t, data }. Entries are kept
// indefinitely so they can be served stale when the API is busy.
const cache = new Map();
// in-flight requests, so identical concurrent calls share one fetch.
const inflight = new Map();
// Global rate-limit cooldown timestamp to avoid queuing calls during 429s
let rateLimitedUntil = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class NotFoundError extends Error {
  constructor(msg) { super(msg); this.code = "NOT_FOUND"; }
}

/* Persist a response to localStorage so the next visit paints
   instantly from the last snapshot (best-effort; quota errors
   silently drop the disk copy). */
function persist(key, entry) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage full — trim our own keys and move on.
    try {
      Object.keys(localStorage).forEach((k) => k.startsWith(LS_PREFIX) && localStorage.removeItem(k));
    } catch { /* ignore */ }
  }
}

/* Read a persisted snapshot for a key (or null). */
function readDisk(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getFallback(path) {
  if (path.includes("/coins/markets")) return FALLBACK_COINS;
  if (path.includes("/global")) return FALLBACK_GLOBAL;
  if (path.includes("/search/trending")) return FALLBACK_TRENDING;
  return null;
}

/* Synchronous cache peek (memory, then disk, then fallback). Powers instant paint. */
export function peek(path) {
  const mem = cache.get(path);
  if (mem) return mem.data;
  const disk = readDisk(path);
  if (disk) {
    cache.set(path, disk); // promote to memory
    return disk.data;
  }
  return getFallback(path);
}

export function peekMarkets() {
  for (const [k, v] of cache.entries()) {
    if (k.includes("/coins/markets") && v?.data?.length) return v.data;
  }
  const diskKeys = ["/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d&locale=en", "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d&locale=en"];
  for (const k of diskKeys) {
    const d = readDisk(k);
    if (d?.data?.length) return d.data;
  }
  return FALLBACK_COINS;
}

export function peekGlobal() {
  return peek("/global") || FALLBACK_GLOBAL;
}

export function peekTrending() {
  return peek("/search/trending") || FALLBACK_TRENDING;
}

/* Network throttle: serialise requests with a minimum gap so we
   never burst past CoinGecko's free-tier limit. Cached reads bypass this entirely. */
const MIN_GAP = 260;
let lastFetchAt = 0;
let queue = Promise.resolve();
function throttledFetch(url, opts) {
  const p = queue.then(async () => {
    const wait = Math.max(0, MIN_GAP - (Date.now() - lastFetchAt));
    if (wait) await sleep(wait);
    lastFetchAt = Date.now();
    return fetch(url, opts);
  });
  queue = p.then(() => {}, () => {});
  return p;
}

/* The actual network call with resilient retries. */
async function fetchFresh(path, { signal, retries = 1 } = {}) {
  const stale = cache.get(path)?.data || readDisk(path)?.data || getFallback(path);

  // If rate limit is active on this IP, don't stall the thread: serve cached/fallback immediately
  if (Date.now() < rateLimitedUntil && stale) {
    return stale;
  }

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await throttledFetch(`${BASE}${path}`, { signal, headers: { accept: "application/json" } });
      if (res.status === 404) throw new NotFoundError("Not found");
      if (res.status === 429 || res.status >= 500) {
        // Cooldown for 35 seconds to allow CoinGecko free quota to recover
        rateLimitedUntil = Date.now() + 35_000;
        if (stale) return stale;
        lastErr = new Error(`Service busy (${res.status})`);
        if (attempt < retries) { await sleep(400); continue; }
        break;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const entry = { t: Date.now(), data };
      cache.set(path, entry);
      persist(path, entry);
      return data;
    } catch (e) {
      if (e.code === "NOT_FOUND" || e.name === "AbortError") throw e;
      lastErr = e;
      if (stale) return stale;
      if (attempt < retries) { await sleep(400); continue; }
    }
  }
  if (stale) return stale;
  throw lastErr || new Error("Network error");
}

/* Stale-while-revalidate fetch */
async function get(path, { ttl = 30_000, signal, retries = 1 } = {}) {
  const key = path;
  const now = Date.now();
  let hit = cache.get(key);
  if (!hit) {
    const disk = readDisk(key);
    if (disk) { cache.set(key, disk); hit = disk; }
  }

  if (hit && now - hit.t < ttl) return hit.data;

  if (inflight.has(key)) {
    return hit ? hit.data : inflight.get(key);
  }

  const run = fetchFresh(path, { signal, retries }).finally(() => inflight.delete(key));
  inflight.set(key, run);

  if (hit) { run.catch(() => {}); return hit.data; }
  const fallback = getFallback(path);
  if (fallback) { run.catch(() => {}); return fallback; }
  return run;
}

/* Global market snapshot: total market cap, volume, BTC dominance… */
export function getGlobal(opts) {
  return get(`/global`, { ttl: 45_000, ...opts });
}

/* Paginated markets table with sparkline + multi-window % change.
   Enriched with institutional real-time Binance orderbook tickers. */
export async function getMarkets(
  { page = 1, perPage = 50, ids = null, order = "market_cap_desc" } = {},
  opts = {}
) {
  const params = new URLSearchParams({
    vs_currency: "usd",
    order,
    per_page: String(perPage),
    page: String(page),
    sparkline: "true",
    price_change_percentage: "1h,24h,7d",
    locale: "en",
  });
  if (ids) params.set("ids", ids.join(","));
  const coins = await get(`/coins/markets?${params}`, { ttl: 25_000, ...opts });
  try {
    const binance = await fetchBinanceTickers();
    return enrichWithRealtimeData(coins, binance);
  } catch {
    return coins;
  }
}

/* Full coin profile: market data, description, links, supply, tickers… */
export function getCoin(id, opts) {
  const params = new URLSearchParams({
    localization: "false",
    tickers: "true",
    market_data: "true",
    community_data: "true",
    developer_data: "true",
    sparkline: "true",
  });
  return get(`/coins/${id}?${params}`, { ttl: 30_000, ...opts });
}

/* Historical price series for the detail chart. `days`: 1,7,30,90,365,max */
export function getMarketChart(id, days = 7, opts) {
  const params = new URLSearchParams({ vs_currency: "usd", days: String(days) });
  if (days > 90) params.set("interval", "daily");
  return get(`/coins/${id}/market_chart?${params}`, {
    ttl: days <= 1 ? 30_000 : 120_000,
    ...opts,
  });
}

/* Coin search by free-text query. */
export function searchCoins(query, opts) {
  return get(`/search?query=${encodeURIComponent(query)}`, { ttl: 120_000, ...opts });
}

/* Trending coins (search-weighted). */
export function getTrending(opts) {
  return get(`/search/trending`, { ttl: 120_000, ...opts });
}

/* Public corporate & government treasuries */
export function getCoinTreasury(coinId = "bitcoin", opts) {
  const cleanId = coinId === "btc" ? "bitcoin" : coinId === "eth" ? "ethereum" : coinId;
  return get(`/companies/public_treasury/${cleanId}`, { ttl: 60_000, ...opts });
}

/* Real-time global fiat and crypto exchange rates */
export function getExchangeRates(opts) {
  return get(`/exchange_rates`, { ttl: 60_000, ...opts });
}

/* Paginated exchange tickers for coin */
export function getCoinTickers(id, page = 1, opts) {
  return get(`/coins/${id}/tickers?page=${page}&include_exchange_logo=true&depth=true`, { ttl: 30_000, ...opts });
}

/* ============================================================
   Formatting helpers — a trading terminal lives on its numbers
   ============================================================ */

export function fmtPrice(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 0.01) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

export function fmtCompact(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(2) + "K";
  return "$" + n.toFixed(2);
}

export function fmtNum(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtPct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const s = n >= 0 ? "+" : "";
  return s + n.toFixed(2) + "%";
}

export function fmtBtc(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1) return n.toFixed(4) + " BTC";
  return n.toFixed(8) + " BTC";
}

export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function fmtTimeAgo(d) {
  if (!d) return "";
  const ms = Date.now() - new Date(d).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 365) return `${days} days ago`;
  const yrs = (days / 365.25).toFixed(1);
  return `${yrs} yrs ago`;
}

