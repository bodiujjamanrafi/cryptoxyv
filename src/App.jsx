import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Background from "./components/Background";
import Preloader from "./components/Preloader";
import RouteLoader from "./components/RouteLoader";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Markets from "./pages/Markets";
import CoinDetail from "./pages/CoinDetail";
import Fundraising from "./pages/Fundraising";
import Login from "./pages/Login";
import MonthlyRaiseHistory from "./pages/MonthlyRaiseHistory";

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/* High-fidelity section fade animation manager.
   Waits until user enters the website (appReady), then performs smooth
   fade animations for top-level sections without layout thrashing. */
function RevealManager({ appReady }) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!appReady) return;

    // Small delay ensures DOM elements from route changes are mounted
    const timer = setTimeout(() => {
      const targets = Array.from(document.querySelectorAll("[data-reveal], .section, .hero, footer"));
      if (!targets.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("sec-fade-entered");
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.01,
          rootMargin: "0px 0px 150px 0px",
        }
      );

      const windowHeight = window.innerHeight;

      targets.forEach((el) => {
        if (!el.classList.contains("sec-fade-entered")) {
          const rect = el.getBoundingClientRect();
          const inViewport = rect.top < windowHeight && rect.bottom > 0;

          if (inViewport) {
            el.classList.add("sec-fade-entered");
          } else {
            el.classList.add("sec-fade-init");
            observer.observe(el);
          }
        }
      });
    }, 40);

    return () => clearTimeout(timer);
  }, [pathname, appReady]);

  return null;
}

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signin";

  return (
    <>
      <Background />
      <Preloader onComplete={() => setAppReady(true)} />
      <RouteLoader />
      <ScrollManager />
      <RevealManager appReady={appReady} />
      <Navbar />
      <main id="top" className={appReady ? "home-opening-entered" : "home-opening-prep"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/liquidation" element={<Home defaultTab="liquidation" />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/coin/:id" element={<CoinDetail />} />
          <Route path="/funding" element={<Fundraising />} />
          <Route path="/fundraising" element={<Fundraising />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/ido-history" element={<MonthlyRaiseHistory />} />
          <Route path="/monthly-raise-history" element={<MonthlyRaiseHistory />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </>
  );
}
