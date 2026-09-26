"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useProductImage } from "@/components/product-image-context";

const SWIPE_PX = 40;

export function ProductGallery({
  images,
  title,
  variants = [],
}: {
  images: string[];
  title: string;
  /** Versions with their own photo — choosing that photo selects the version. */
  variants?: { id: string; image?: string }[];
}) {
  const shared = useProductImage();
  const [localImage, setLocalImage] = useState(images[0]);
  // A selected version's photo (from ProductOptions) wins over the local pick.
  const activeImage = shared?.activeImage ?? localImage;
  const activeIndex = Math.max(0, images.indexOf(activeImage));
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [zoomed, setZoomed] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef<number | null>(null);

  function show(image: string) {
    (shared?.setActiveImage ?? setLocalImage)(image);
    const variant = variants.find((v) => v.image === image);
    if (variant) shared?.setSelectedVariantId(variant.id);
  }
  const step = (delta: number) => show(images[(activeIndex + delta + images.length) % images.length]);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }

  const multiple = images.length > 1;

  return (
    <div
      className="rounded-3xl bg-white p-4 ring-1 ring-ink/[0.05] sm:p-6"
      onKeyDown={(event) => {
        if (!multiple || lightbox) return;
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
    >
      {/* Square, and capped by the screen height, so the whole photo is always
          in view at once — never cropped, never taller than the viewport. */}
      <div
        className="group relative mx-auto aspect-square w-full max-w-[min(100%,calc(100svh-15rem))] cursor-zoom-in overflow-hidden rounded-2xl bg-surface"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onClick={() => setLightbox(true)}
        onTouchStart={(event) => {
          touchX.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchX.current === null) return;
          const delta = event.changedTouches[0].clientX - touchX.current;
          if (multiple && Math.abs(delta) > SWIPE_PX) step(delta < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {/* Every photo stays mounted and crossfades, so switching never waits on a download. */}
        {images.map((image, i) => (
          <Image
            key={image}
            src={image}
            alt={i === activeIndex ? title : ""}
            fill
            priority={i === 0}
            loading={i === 0 ? undefined : "eager"}
            sizes="(min-width: 1024px) 45vw, 92vw"
            className={`object-cover transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
              i === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            style={
              i === activeIndex
                ? { transformOrigin: zoomOrigin, transform: zoomed ? "scale(1.9)" : "scale(1)" }
                : undefined
            }
          />
        ))}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setLightbox(true);
          }}
          aria-label="View full screen"
          className="absolute top-3 right-3 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition-opacity hover:bg-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
        >
          <Expand className="h-4 w-4" />
        </button>

        {multiple && (
          <>
            <GalleryArrow side="left" onClick={() => step(-1)} />
            <GalleryArrow side="right" onClick={() => step(1)} />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-white tabular-nums backdrop-blur sm:hidden">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {multiple && (
        <div className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto p-1 sm:justify-center">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => show(image)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-current={index === activeIndex}
              className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-surface transition-all duration-200 sm:h-[4.5rem] sm:w-[4.5rem] ${
                index === activeIndex
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-white"
                  : "opacity-70 ring-1 ring-ink/10 hover:opacity-100"
              }`}
            >
              <Image src={image} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox
          images={images}
          index={activeIndex}
          title={title}
          onStep={step}
          onSelect={(i) => show(images[i])}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition-opacity hover:bg-white max-sm:hidden [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}

/** Full-screen viewer — a native <dialog>, so focus trapping and Esc come for free. */
function Lightbox({
  images,
  index,
  title,
  onStep,
  onSelect,
  onClose,
}: {
  images: string[];
  index: number;
  title: string;
  onStep: (delta: number) => void;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") onStep(1);
        if (event.key === "ArrowLeft") onStep(-1);
      }}
      aria-label={`${title} — photos`}
      className="lightbox m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink/90"
    >
      <div
        className="flex h-full flex-col items-center justify-center gap-5 p-4 sm:p-8"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative aspect-square w-full max-w-[min(100%,calc(100dvh-10rem))] overflow-hidden rounded-2xl bg-white">
          <Image
            key={images[index]}
            src={images[index]}
            alt={title}
            fill
            sizes="90vw"
            className="animate-fade-in object-contain"
          />
        </div>
        {images.length > 1 && (
          <div className="flex items-center gap-3">
            <LightboxButton label="Previous image" onClick={() => onStep(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </LightboxButton>
            <div className="flex gap-2">
              {images.map((image, i) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => onSelect(i)}
                  aria-label={`Show image ${i + 1} of ${images.length}`}
                  aria-current={i === index}
                  className={`relative h-12 w-12 cursor-pointer overflow-hidden rounded-lg transition-opacity ${
                    i === index ? "ring-2 ring-white" : "opacity-50 hover:opacity-90"
                  }`}
                >
                  <Image src={image} alt="" fill sizes="48px" className="object-cover" />
                </button>
              ))}
            </div>
            <LightboxButton label="Next image" onClick={() => onStep(1)}>
              <ChevronRight className="h-5 w-5" />
            </LightboxButton>
          </div>
        )}
      </div>
    </dialog>
  );
}

function LightboxButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
    >
      {children}
    </button>
  );
}
