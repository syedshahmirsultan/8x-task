"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [zoomed, setZoomed] = useState(false);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }

  return (
    <div className="flex gap-3">
      {images.length > 1 && (
        <div className="flex shrink-0 flex-col gap-2">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-current={index === activeIndex}
              className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-colors ${
                index === activeIndex
                  ? "border-accent-buy"
                  : "border-border hover:border-link"
              }`}
            >
              <Image src={image} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Hover-zoom: moving the cursor sets the CSS transform-origin to that
          point and scales the image up around it, so whatever the shopper
          points at is what zooms in — no separate lens panel needed. */}
      <div
        className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-lg border border-border bg-white"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        <Image
          src={images[activeIndex]}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 90vw"
          className="object-cover transition-transform duration-200 ease-out"
          style={{
            transformOrigin: zoomOrigin,
            transform: zoomed ? "scale(2)" : "scale(1)",
          }}
        />
      </div>
    </div>
  );
}
