"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** How far down the page before the header is allowed to hide — avoids
 * flicker from tiny scroll jitters right at the top. */
const HIDE_THRESHOLD_PX = 80;

export function StickyHeaderShell({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function handleScroll() {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastScrollY.current;
      setHidden(scrollingDown && currentY > HIDE_THRESHOLD_PX);
      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-transform duration-300 ease-in-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {children}
    </header>
  );
}
