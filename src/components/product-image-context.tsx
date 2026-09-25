"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Shared between ProductGallery and ProductOptions, which render as sibling
// columns on the PDP: choosing a version shows its photo, and clicking a
// version's photo in the gallery selects that version.
interface ProductSelection {
  /** Null until the shopper picks something — each component falls back to its own default. */
  activeImage: string | null;
  setActiveImage: (image: string) => void;
  selectedVariantId: string | null;
  setSelectedVariantId: (id: string) => void;
}

const ProductSelectionContext = createContext<ProductSelection | null>(null);

export function ProductImageProvider({ children }: { children: ReactNode }) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  return (
    <ProductSelectionContext.Provider
      value={{ activeImage, setActiveImage, selectedVariantId, setSelectedVariantId }}
    >
      {children}
    </ProductSelectionContext.Provider>
  );
}

/** Null outside a provider — the gallery and options then keep their own local selection. */
export function useProductImage() {
  return useContext(ProductSelectionContext);
}
