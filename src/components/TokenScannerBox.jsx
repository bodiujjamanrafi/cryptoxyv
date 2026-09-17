import { useState, useEffect, useRef, useMemo, memo } from "react";
import { DEFAULT_SCANNER_COINS, TOKEN_CONTRACT_REGISTRY } from "../api/tokenScannerData";

function TokenScannerBox({ coins = [], onScanCoin }) {
  // Merge live coins with default curated tokens so NEAR, Bitcoin, Ethereum are always first
  const tokenPool = useMemo(() => {
    const basePool = [...DEFAULT_SCANNER_COINS];

    if (coins && coins.length > 0) {
      coins.forEach((c) => {
        const id = c.id?.toLowerCase();
        const existingIdx = basePool.findIndex((b) => b.id === id);
        if (existingIdx >= 0) {
          basePool[existingIdx] = {
            ...basePool[existingIdx],
            current_price: c.current_price ?? basePool[existingIdx].current_price,
            price_change_percentage_24h:
              c.price_change_percentage_24h ?? basePool[existingIdx].price_change_percentage_24h,
            market_cap: c.market_cap ?? basePool[existingIdx].market_cap,
            total_volume: c.total_volume ?? basePool[existingIdx].total_volume,
          };
        } else if (basePool.length < 20) {
          const reg = TOKEN_CONTRACT_REGISTRY[id] || {};
          basePool.push({
            id: c.id,
            name: c.name,
            symbol: c.symbol?.toUpperCase(),
            image: c.image,
            current_price: c.current_price,
            price_change_percentage_24h: c.price_change_percentage_24h,
            market_cap: c.market_cap,
            total_volume: c.total_volume,
            trustScore: reg.trustScore || (c.market_cap_rank && c.market_cap_rank <= 10 ? 92 : 86),
            blueCount: reg.blueCount !== undefined ? reg.blueCount : 1,
            redCount: reg.redCount !== undefined ? reg.redCount : 4,
            greenCount: reg.greenCount !== undefined ? reg.greenCount : 4,
          });
        }
      });
    }

    return basePool;
  }, [coins]);

  const [startIndex, setStartIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef(null);
  const lastWheelTime = useRef(0);
  const boxRef = useRef(null);
  const touchStartY = useRef(null);

  // Helper to pause auto-advance temporarily during user interaction
  const pauseTemporarily = (duration = 2500) => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, duration);
  };

  // Auto-advance by 1 token every 1.5s when not hovered or actively interacted
  useEffect(() => {
    if (tokenPool.length <= 3) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        setStartIndex((prev) => (prev + 1) % tokenPool.length);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [tokenPool.length, isPaused]);

  // Wheel listener: allow mouse wheel to smoothly cycle tokens up/down
  useEffect(() => {
    const el = boxRef.current;
    if (!el || tokenPool.length <= 3) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const now = Date.now();
        if (now - lastWheelTime.current < 130) return; // throttle

        if (e.deltaY > 6) {
          e.preventDefault();
          setStartIndex((prev) => (prev + 1) % tokenPool.length);
          lastWheelTime.current = now;
          pauseTemporarily(3000);
        } else if (e.deltaY < -6) {
          e.preventDefault();
          setStartIndex((prev) => (prev - 1 + tokenPool.length) % tokenPool.length);
          lastWheelTime.current = now;
          pauseTemporarily(3000);
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [tokenPool.length]);

  // Touch gesture support on mobile devices
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    pauseTemporarily(3000);
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null || tokenPool.length <= 3) return;
    const diff = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(diff) > 24) {
      if (diff > 0) {
        setStartIndex((prev) => (prev + 1) % tokenPool.length);
      } else {
        setStartIndex((prev) => (prev - 1 + tokenPool.length) % tokenPool.length);
      }
      touchStartY.current = e.touches[0].clientY;
      pauseTemporarily(3000);
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  // Hover handlers: pause auto-advance while cursor is inside so nothing moves under the pointer
  const handleMouseEnter = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  };

  // Exactly 3 tokens are calculated and rendered at all times
  const visibleTokens = useMemo(() => {
    if (tokenPool.length === 0) return [];
    const count = Math.min(3, tokenPool.length);
    const result = [];
    for (let i = 0; i < count; i++) {
      const idx = (startIndex + i) % tokenPool.length;
      result.push({
        coin: tokenPool[idx],
        slot: i,
        // Composite render key: when startIndex advances, slots get fresh keys to trigger zoom-fade animation
        renderKey: `${tokenPool[idx].id}-${startIndex}-${i}`,
      });
    }
    return result;
  }, [tokenPool, startIndex]);

  // Header scan button scans the topmost currently visible token
  const handleHeaderScan = () => {
    if (visibleTokens.length === 0) return;
    onScanCoin(visibleTokens[0].coin);
  };

  if (tokenPool.length === 0) return null;

  return (
    <div className="token-scanner-ref-wrapper">
      <div
        className="token-scanner-ref-card"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top Header Bar */}
        <div className="scanner-ref-header">
          <div className="scanner-ref-title-group">
            <div className="scanner-ref-icon-circle">
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
                <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3" />
                <circle cx="10" cy="12" r=".7" fill="#ffffff" />
                <circle cx="14" cy="12" r=".7" fill="#ffffff" />
              </svg>
            </div>
            <h3 className="scanner-ref-title">Token scanner</h3>
          </div>

          <button
            className="scanner-ref-action-btn"
            onClick={handleHeaderScan}
            title="Scan active token"
            aria-label="Scan token"
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
          </button>
        </div>

        {/* Inner Box with 4 Corner Brackets & Smooth Token Slots */}
        <div
          ref={boxRef}
          className="scanner-ref-inner-box"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <span className="scanner-bracket bracket-tl" />
          <span className="scanner-bracket bracket-tr" />
          <span className="scanner-bracket bracket-bl" />
          <span className="scanner-bracket bracket-br" />

          {/* Smooth Natural Token Rows */}
          <div className="scanner-ref-scroll-list">
            {visibleTokens.map(({ coin, renderKey, slot }) => {
              if (!coin) return null;
              const trustScore = coin.trustScore ?? 92;
              const blue = coin.blueCount ?? 0;
              const red = coin.redCount ?? 4;
              const green = coin.greenCount ?? 4;

              // SVG Circle properties for gauge
              const radius = 15;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (circumference * trustScore) / 100;

              return (
                <div
                  key={renderKey}
                  role="button"
                  tabIndex={0}
                  className="scanner-ref-row token-zoom-fade"
                  style={{ animationDelay: `${slot * 65}ms` }}
                  onClick={() => onScanCoin(coin)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onScanCoin(coin);
                    }
                  }}
                  title={`Click to scan ${coin.name}`}
                >
                  {/* Left: Token Logo, Name, Verified Badge */}
                  <div className="scanner-row-left">
                    <div className="scanner-row-logo-wrap">
                      {coin.image ? (
                        <img src={coin.image} alt={coin.name} className="scanner-row-logo" />
                      ) : (
                        <div className="scanner-row-logo-fallback">
                          {coin.symbol?.slice(0, 2) || "TK"}
                        </div>
                      )}
                    </div>
                    <span className="scanner-row-name">{coin.name}</span>
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
                  </div>

                  {/* Right: Blue pill, Red pill, Green pill, Circular Gauge */}
                  <div className="scanner-row-right">
                    <span className="scanner-pill-blue mono">{blue}</span>
                    <span className="scanner-pill-red mono">{red}</span>
                    <span className="scanner-pill-green mono">{green}</span>

                    <div className="scanner-row-gauge">
                      <svg width="38" height="38" viewBox="0 0 38 38">
                        <circle
                          cx="19"
                          cy="19"
                          r={radius}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.08)"
                          strokeWidth="3.2"
                        />
                        <circle
                          cx="19"
                          cy="19"
                          r={radius}
                          fill="none"
                          stroke="#00e599"
                          strokeWidth="3.2"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          transform="rotate(-90 19 19)"
                          style={{
                            filter: "drop-shadow(0 0 4px rgba(0, 229, 153, 0.5))",
                          }}
                        />
                      </svg>
                      <span className="scanner-row-score mono">{trustScore}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TokenScannerBox);
