import { useEffect, useRef, useState, useCallback } from "react";

/* ============================================================
   usePolling — fetch on mount, then refresh on an interval.
   Keeps previous data visible during refetches (no flicker),
   pauses while the tab is hidden, and exposes refresh state.
   ============================================================ */
export function usePolling(fetcher, { interval = 60_000, deps = [], initialData = null } = {}) {
  const init = typeof initialData === "function" ? initialData() : initialData;
  const [data, setData] = useState(init);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(init == null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(init ? Date.now() : null);
  const savedFetcher = useRef(fetcher);
  savedFetcher.current = fetcher;

  const run = useCallback(async (isInitial) => {
    try {
      if (!isInitial) setRefreshing(true);
      const result = await savedFetcher.current();
      if (result != null) {
        setData(result);
        setError(null);
        setUpdatedAt(Date.now());
      }
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (init == null) setLoading(true);
    run(true);
    let id = setInterval(() => {
      if (!document.hidden) run(false);
    }, interval);
    const onVis = () => { if (!document.hidden) run(false); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, refreshing, updatedAt, refresh: () => run(false) };
}
