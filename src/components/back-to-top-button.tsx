"use client";

export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="w-full bg-brand-secondary py-3 text-center text-sm transition-colors hover:bg-brand-secondary-hover"
    >
      Back to top
    </button>
  );
}
