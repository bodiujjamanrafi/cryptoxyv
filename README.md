# Asteron — Live Crypto Market Terminal

A real-time crypto market intelligence terminal built with **React 19 + Vite**, a
**Three.js** signature background, and live data from the **CoinGecko** public API.

## Features

- **3D plasma node-network background** (`src/three/plasmaField.js`) — a rotating
  sphere of market nodes with parallax, additive-blended filaments, and ambient haze.
- **Home** — hero, live *Market Pulse* instrument, scrolling price ticker, global
  stats, trending coins, and a top-assets table.
- **Markets** (`/markets`) — full sortable, paginated table with sparklines and
  multi-window momentum (1h / 24h / 7d), auto-refreshing every 60s.
- **Coin detail** (`/coin/:id`) — live price, interactive crosshair area chart with
  24H → Max timeframes, market & all-time stats, circulating-supply bar, and profile.
- **Instant search** in the navbar (keyboard navigable) over 10,000+ assets.
- Fully responsive, reduced-motion aware, with a tiny TTL cache + rate-limit handling.

## Design system

- **Display:** Space Grotesk · **Body:** Inter · **Data:** JetBrains Mono (tabular)
- Obsidian base with a cyan → periwinkle → violet *plasma* accent; gold reserved for
  the brand mark and rank/Pro markers. Tokens live in `src/index.css`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

## Data

All market data comes from the free CoinGecko public API (no key required). The data
layer and formatting helpers live in `src/api/coingecko.js`.

> Deploying? Add an SPA fallback (rewrite all routes to `/index.html`) so deep links
> like `/coin/bitcoin` resolve on refresh.

Market data is for information only — not financial advice.
