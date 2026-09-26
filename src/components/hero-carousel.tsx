"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { formatPrice } from "@/lib/format";

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  blurb: string;
  price: number;
  compareAtPrice?: number;
  href: string;
  image: string;
  categoryName: string;
  categoryHref: string;
  /** Tailwind background class for the text panel, e.g. "bg-brand". */
  tint: string;
}

const SLIDE_MS = 5000;
const SWIPE_PX = 48;

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeNothing = () => () => {};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  // Autoplay starts after hydration so the server render and first client
  // render agree (the progress bar is only animated on the client).
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const touchX = useRef<number | null>(null);
  /** Time left on the current slide, carried across pauses so resuming doesn't restart it. */
  const remainingRef = useRef(SLIDE_MS);
  /** Set when the slide changes, so the timer's cleanup doesn't bill that slide's time to the next one. */
  const slideChangedRef = useRef(false);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const count = slides.length;
  /** Whether the slideshow can auto-advance at all on this device. */
  const autoplay = hydrated && count > 1 && !reducedMotion;
  const paused = userPaused || hovered || focused || tabHidden;

  const go = (next: number) => {
    remainingRef.current = SLIDE_MS;
    slideChangedRef.current = true;
    setIndex((next + count) % count);
  };

  // A plain timer drives the slideshow; the progress bar is only a picture of
  // it. (CSS animationend can't be the clock: browsers stop animating
  // background or undrawn tabs, and the event can fire before hydration.)
  const running = autoplay && !paused;
  useEffect(() => {
    if (!running) return;
    slideChangedRef.current = false; // clear any change made while paused
    const startedAt = performance.now();
    const timer = setTimeout(() => {
      remainingRef.current = SLIDE_MS;
      slideChangedRef.current = true;
      setIndex((i) => (i + 1) % count);
    }, remainingRef.current);
    return () => {
      clearTimeout(timer);
      if (slideChangedRef.current) {
        slideChangedRef.current = false;
      } else {
        remainingRef.current = Math.max(0, remainingRef.current - (performance.now() - startedAt));
      }
    };
  }, [running, index, count]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured products"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Pause for keyboard focus only — a mouse click on a control shouldn't
      // leave the slideshow stuck paused while that control keeps focus.
      onFocus={(event) => {
        if ((event.target as HTMLElement).matches(":focus-visible")) setFocused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(index + 1);
        if (event.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(event) => {
        touchX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const delta = event.changedTouches[0].clientX - touchX.current;
        if (Math.abs(delta) > SWIPE_PX) go(index + (delta < 0 ? 1 : -1));
        touchX.current = null;
      }}
      className="relative h-[38rem] overflow-hidden rounded-3xl bg-brand sm:h-[34rem] lg:h-[min(38rem,74vh)]"
    >
      {/* Announce slide changes only when the shopper drives them — an
          auto-advancing live region would talk over everything. */}
      <div aria-live={running ? "off" : "polite"} className="h-full">
        {slides.map((slide, i) => {
          const active = i === index;
          const onSale = slide.compareAtPrice !== undefined && slide.compareAtPrice > slide.price;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${slide.title}`}
              aria-hidden={!active}
              inert={!active}
              className={`absolute inset-0 grid grid-rows-[minmax(13rem,1fr)_auto] transition-opacity duration-700 ease-(--ease-in-out) md:grid-cols-2 md:grid-rows-1 ${
                active ? "z-10 opacity-100" : "z-0 opacity-0"
              }`}
            >
              <div className="relative order-first overflow-hidden md:order-last">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={i === 0}
                  // Only five slides: load them all up front so a slide
                  // never fades in on an empty panel.
                  loading={i === 0 ? undefined : "eager"}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className={`object-cover transition-transform ease-out motion-reduce:transition-none ${
                    active ? "scale-100 duration-[6500ms]" : "scale-[1.05] duration-700"
                  }`}
                />
              </div>

              <div className={`flex min-h-0 flex-col justify-center px-6 pt-5 pb-20 text-white sm:px-10 md:pt-10 md:pb-24 lg:pl-14 ${slide.tint}`}>
                <div
                  className={`transition-[opacity,transform] duration-700 ease-(--ease-out) motion-reduce:transition-none ${
                    active ? "translate-y-0 opacity-100 delay-200" : "translate-y-3 opacity-0"
                  }`}
                >
                  <p className="text-xs font-semibold tracking-wide text-accent uppercase">{slide.eyebrow}</p>
                  <h2 className="mt-3 line-clamp-3 text-[1.8rem] leading-[1.08] lg:line-clamp-2 font-semibold tracking-[-0.03em] [overflow-wrap:anywhere] sm:text-[2.5rem] md:text-[2.1rem] lg:text-[2.6rem] xl:text-5xl">
                    {slide.title}
                  </h2>
                  <p className="mt-4 line-clamp-2 max-w-md text-[0.95rem] leading-relaxed text-white/70 max-sm:hidden">{slide.blurb}</p>
                  <p className="mt-3 flex items-baseline gap-3 tabular-nums sm:mt-5">
                    <span className="text-xl font-semibold">{formatPrice(slide.price)}</span>
                    {onSale && (
                      <span className="text-sm text-white/50 line-through">{formatPrice(slide.compareAtPrice!)}</span>
                    )}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-7">
                    <Link
                      href={slide.href}
                      className="group inline-flex h-12 items-center gap-2 rounded-full bg-accent-cart px-6 text-sm font-semibold whitespace-nowrap text-ink transition-[transform,background-color] duration-200 ease-(--ease-out) hover:-translate-y-0.5 hover:bg-accent-cart-hover active:translate-y-0"
                    >
                      Shop now
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      href={slide.categoryHref}
                      className="text-sm font-medium whitespace-nowrap text-white/85 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
                    >
                      More in {slide.categoryName}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-6 bottom-6 z-20 flex items-center gap-4 sm:inset-x-10 lg:right-auto lg:left-14 lg:w-[calc(50%-7rem)]">
          <div className="flex flex-1 gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${slide.title}`}
                aria-current={i === index}
                className="group h-6 flex-1 cursor-pointer py-2.5"
              >
                <span className="relative block h-1 overflow-hidden rounded-full bg-white/20 transition-colors group-hover:bg-white/35">
                  {i < index && <span className="absolute inset-0 bg-white" />}
                  {i === index && (
                    <span
                      // Keyed on the index so returning to a slide restarts its bar.
                      key={index}
                      // The bar keeps its animation while paused and only
                      // freezes, so resuming carries on from the same point —
                      // in step with the timer's remaining time.
                      className={`absolute inset-0 origin-left bg-accent ${autoplay ? "animate-hero-progress" : ""}`}
                      style={{
                        animationDuration: `${SLIDE_MS}ms`,
                        animationPlayState: running ? "running" : "paused",
                      }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-1.5">
            {!reducedMotion && (
              <HeroButton
                label={userPaused ? "Play slideshow" : "Pause slideshow"}
                onClick={() => {
                  // Play is an explicit instruction: resume now, even though
                  // the pointer is over the carousel and the button has focus.
                  // Hover pausing picks up again on the next mouseenter.
                  if (userPaused) {
                    setHovered(false);
                    setFocused(false);
                  }
                  setUserPaused((value) => !value);
                }}
              >
                {userPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </HeroButton>
            )}
            <HeroButton label="Previous slide" onClick={() => go(index - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </HeroButton>
            <HeroButton label="Next slide" onClick={() => go(index + 1)}>
              <ChevronRight className="h-4 w-4" />
            </HeroButton>
          </div>
        </div>
      )}
    </section>
  );
}

function HeroButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/25"
    >
      {children}
    </button>
  );
}
