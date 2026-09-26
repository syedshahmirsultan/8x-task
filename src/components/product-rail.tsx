"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import type { Product } from "@/data/types";

/** Drift speed in px/s — slow enough to read a card as it passes. */
const DRIFT_SPEED = 28;
/** Pause at each end before drifting back the other way. */
const END_HOLD_MS = 1600;
/** After the shopper scrolls or drags the rail themselves, leave it alone this long. */
const RESUME_AFTER_MS = 3000;

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A horizontal row of product cards that slowly drifts back and forth when
 * it's wider than the screen. Ping-pong rather than an endless loop, so a
 * short list never shows the same product twice.
 */
export function ProductRail({
  title,
  products,
  href,
  linkLabel = "See all",
}: {
  title: string;
  products: Product[];
  href?: string;
  linkLabel?: string;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const visibleRef = useRef(false);
  const resumeAtRef = useRef(0);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || reducedMotion) return;
    let frame = 0;
    let last = performance.now();
    let position = el.scrollLeft;
    let direction = 1;
    let holdUntil = 0;

    function tick(now: number) {
      const dt = Math.min(now - last, 64);
      last = now;
      const max = el!.scrollWidth - el!.clientWidth;
      const running =
        max > 4 &&
        visibleRef.current &&
        !hoverRef.current &&
        !focusRef.current &&
        !document.hidden &&
        now >= holdUntil &&
        now >= resumeAtRef.current;

      if (running) {
        // The browser may round scrollLeft; keep our own sub-pixel position,
        // and resync if the shopper moved the rail.
        if (Math.abs(el!.scrollLeft - position) > 2) position = el!.scrollLeft;
        position += (direction * DRIFT_SPEED * dt) / 1000;
        if (position >= max) {
          position = max;
          direction = -1;
          holdUntil = now + END_HOLD_MS;
        } else if (position <= 0) {
          position = 0;
          direction = 1;
          holdUntil = now + END_HOLD_MS;
        }
        el!.scrollLeft = position;
      } else {
        position = el!.scrollLeft;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  if (products.length === 0) return null;

  function holdForUser() {
    resumeAtRef.current = performance.now() + RESUME_AFTER_MS;
  }

  function page(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    holdForUser();
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reducedMotion ? "auto" : "smooth" });
  }

  return (
    <section className="mt-20 sm:mt-24">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading title={title} href={href} linkLabel={linkLabel} />
        <div className="hidden shrink-0 gap-2 sm:flex">
          <RailButton label={`Scroll ${title} back`} onClick={() => page(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </RailButton>
          <RailButton label={`Scroll ${title} forward`} onClick={() => page(1)}>
            <ChevronRight className="h-4 w-4" />
          </RailButton>
        </div>
      </div>
      <ul
        ref={scrollerRef}
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
        onFocus={() => (focusRef.current = true)}
        onBlur={() => (focusRef.current = false)}
        onWheel={holdForUser}
        onTouchStart={holdForUser}
        onPointerDown={holdForUser}
        className="no-scrollbar -mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pt-1 pb-6 sm:-mx-6 sm:gap-5 sm:px-6"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-[13.5rem] shrink-0 sm:w-[15.5rem]" />
        ))}
      </ul>
    </section>
  );
}

function RailButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white text-ink ring-1 ring-ink/[0.08] transition-[box-shadow,background-color] hover:ring-ink/25 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
