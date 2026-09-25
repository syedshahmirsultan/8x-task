"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const MAX_DIMENSION = 1600;

/**
 * Shrinks the photo to at most 1600px on its longest side and re-encodes it
 * as WebP before upload — phone photos are often 5-10MB, and uploads are
 * stored in the database, so this keeps each one to a few hundred KB.
 */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))), "image/webp", 0.85),
  );
}

async function uploadImage(file: File): Promise<string> {
  const blob = await compressImage(file).catch(() => file);
  const body = new FormData();
  body.append("file", blob, file.name.replace(/\.\w+$/, "") + (blob === file ? "" : ".webp"));
  const res = await fetch("/api/admin/uploads", { method: "POST", body });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return data.url;
}

function isValidImageUrl(value: string): boolean {
  return /^https:\/\/\S+$/.test(value);
}

/** Upload-or-paste-URL controls shared by both image fields. */
function AddImageControls({
  multiple,
  onAdd,
  compact = false,
}: {
  multiple: boolean;
  onAdd: (urls: string[]) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [url, setUrl] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        uploaded.push(await uploadImage(file));
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "Upload failed."}`);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded.length > 0) onAdd(uploaded);
  }

  function handleAddUrl() {
    const trimmed = url.trim();
    if (!isValidImageUrl(trimmed)) {
      toast.error("Paste a full https:// image URL.");
      return;
    }
    onAdd([trimmed]);
    setUrl("");
    setShowUrl(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-white font-medium transition-colors hover:border-link disabled:cursor-wait disabled:opacity-60 ${compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? "Uploading…" : multiple ? "Upload images" : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => setShowUrl((value) => !value)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-white font-medium transition-colors hover:border-link ${compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
        >
          <Link2 className="h-4 w-4" />
          Paste URL
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple={multiple}
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {showUrl && (
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="https://example.com/photo.jpg"
            className="input-field"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="shrink-0 cursor-pointer rounded-md bg-brand px-3 text-sm font-medium text-white"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

function Thumb({ src, size }: { src: string; size: number }) {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-md border border-border bg-background" style={{ width: size, height: size }}>
      {/* unoptimized: admin previews skip the optimizer so a just-pasted URL shows immediately. */}
      <Image src={src} alt="" fill unoptimized sizes={`${size}px`} className="object-cover" />
    </div>
  );
}

/** Ordered product gallery — the first image is the one shown on listing cards. */
export function ImageListField({ value, onChange }: { value: string[]; onChange: (images: string[]) => void }) {
  function move(index: number, delta: number) {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {value.map((src, index) => (
            <li key={src} className="w-28 space-y-1">
              <div className="relative">
                <Thumb src={src} size={112} />
                {index === 0 && (
                  <span className="absolute top-1 left-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  aria-label="Remove image"
                  className="absolute top-1 right-1 cursor-pointer rounded-full bg-white/90 p-0.5 text-gray-700 shadow hover:text-price"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move image left"
                  className="cursor-pointer rounded p-1 text-gray-500 hover:bg-background disabled:invisible"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label="Move image right"
                  className="cursor-pointer rounded p-1 text-gray-500 hover:bg-background disabled:invisible"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No images yet — add at least one.</p>
      )}
      <AddImageControls multiple onAdd={(urls) => onChange([...value, ...urls.filter((u) => !value.includes(u))])} />
    </div>
  );
}

/** A single optional image — used for a variant's own photo and category tiles. */
export function SingleImageField({
  value,
  onChange,
  compact = false,
}: {
  value: string | null;
  onChange: (image: string | null) => void;
  compact?: boolean;
}) {
  const size = compact ? 40 : 96;
  return (
    <div className="flex items-start gap-2">
      {value && (
        <div className="relative">
          <Thumb src={value} size={size} />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove image"
            className="absolute -top-1.5 -right-1.5 cursor-pointer rounded-full bg-white p-0.5 text-gray-700 shadow hover:text-price"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <AddImageControls compact={compact} multiple={false} onAdd={(urls) => onChange(urls[0] ?? null)} />
    </div>
  );
}
