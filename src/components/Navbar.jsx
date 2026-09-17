import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { searchCoins } from "../api/coingecko";

import AsteronLogo from "./AsteronLogo";

function Logo() {
  return (
    <Link to="/" className="brand" aria-label="Asteron home">
      <AsteronLogo size={30} />
      <span className="brand-name">
        Aster<span className="brand-accent">on</span>
      </span>
    </Link>
  );
}

function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchCoins(q.trim());
        setResults((data.coins || []).slice(0, 8));
        setActive(0);
        setOpen(true);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        if (q.trim() && results.length) setOpen(true);
      }
    };
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  }, [q, results]);

  function go(id) {
    setQ("");
    setResults([]);
    setOpen(false);
    nav(`/coin/${id}`);
  }

  function onKey(e) {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(results[active].id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="search" ref={boxRef}>
      <svg className="search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search coins…"
        aria-label="Search coins"
        autoComplete="off"
        spellCheck="false"
      />
      {q ? (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => {
            setQ("");
            setResults([]);
            setOpen(false);
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          title="Clear search"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : (
        <kbd className="search-kbd mono">⌘K</kbd>
      )}

      {open && results.length > 0 && (
        <div className="search-pop">
          <div className="search-pop-header">
            <span className="search-pop-title mono">Assets</span>
            <span className="search-pop-count mono">{results.length} found</span>
          </div>
          <div className="search-pop-list">
            {results.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`search-item ${i === active ? "active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(c.id)}
              >
                {c.thumb ? (
                  <img src={c.thumb} alt="" className="si-thumb" width="22" height="22" />
                ) : (
                  <div className="si-thumb-placeholder mono">{(c.symbol || "?").slice(0, 2)}</div>
                )}
                <div className="si-content">
                  <span className="si-name">{c.name}</span>
                  <span className="si-sym mono">{c.symbol}</span>
                </div>
                {c.market_cap_rank && (
                  <span className="si-rank mono">#{c.market_cap_rank}</span>
                )}
                <svg className="si-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
          <div className="search-pop-footer mono">
            <span><kbd>↑↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </div>
      )}

      {open && !results.length && !loading && q.trim().length >= 2 && (
        <div className="search-pop">
          <div className="search-empty mono">
            No assets found for &ldquo;{q}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    let prev = false;
    const onScroll = () => {
      const isScrolled = window.scrollY > 12;
      if (isScrolled !== prev) {
        prev = isScrolled;
        setScrolled(isScrolled);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-inner container">
          <Logo />
          <nav className={`nav-links ${menu ? "open" : ""}`} onClick={() => setMenu(false)}>
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
            <NavLink to="/markets" className={({ isActive }) => (isActive ? "active" : "")}>Markets</NavLink>
            <NavLink to="/funding" className={({ isActive }) => (isActive ? "active" : "")}>Fundraising</NavLink>
            <a href="/#pulse">Market Pulse</a>
            <a href="/#features">Platform</a>
            <Link to="/login" className="nav-mobile-cta">
              Launch Terminal
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </nav>
          <div className="nav-right">
            <SearchBar />
            <Link to="/login" className="btn btn-primary nav-cta">Launch Terminal</Link>
            <button className={`nav-burger ${menu ? "open" : ""}`} aria-label="Menu" onClick={() => setMenu((m) => !m)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
      {menu && <div className="nav-backdrop" onClick={() => setMenu(false)} />}
    </>
  );
}
