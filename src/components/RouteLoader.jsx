import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/* A small circular spinner shown briefly whenever the route changes,
   giving each page navigation a clear, premium loading beat. */
export default function RouteLoader() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // Skip the very first mount (the full preloader covers that).
    if (first.current) { first.current = false; return; }
    setShow(true);
    const t = setTimeout(() => setShow(false), 650);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="route-loader" role="status" aria-label="Loading page">
      <span className="route-spinner" />
    </div>
  );
}
