import { useEffect } from "react";
import { useLocation } from "react-router";

/** Side-nav hashes land on Overview sections after App Bridge navigation. */
export function useDeskHashScroll() {
  const location = useLocation();
  useEffect(() => {
    const id = location.hash.replace(/^#/, "");
    if (!id) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname, location.search]);
}
