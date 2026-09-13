"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useSyncExternalStore } from "react";
import { useChat } from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import {
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  MessageCircle,
  Plus,
  RotateCw,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart, type CartLineItem } from "@/lib/cart-context";
import type { Product } from "@/data/types";

const TOOL_STATUS_LABELS: Record<string, string> = {
  search_products: "Searching products…",
  get_product_details: "Looking up product details…",
  list_categories: "Checking categories…",
  get_order_history: "Checking your orders…",
  view_cart: "Checking your cart…",
  add_to_cart: "Adding to your cart…",
  remove_from_cart: "Updating your cart…",
  start_checkout: "Starting checkout…",
};

// Chat history is persisted client-side only (never sent anywhere but the
// model itself), capped so a long-running conversation can't grow the
// payload/localStorage usage without bound.
const MAX_STORED_MESSAGES = 30;
// Each open chat tab is its own conversation thread — capped so a browsing
// session can't accumulate an unbounded number of stored tabs.
const MAX_SESSIONS = 8;

type Size = "compact" | "full";

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: UIMessage[];
}

interface SessionsSnapshot {
  activeId: string;
  tabs: { id: string; title: string }[];
}

const EMPTY_SESSIONS_SNAPSHOT: SessionsSnapshot = { activeId: "", tabs: [] };

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptySession(): ChatSession {
  return {
    id: randomId(),
    title: "New chat",
    createdAt: Date.now(),
    messages: [],
  };
}

function sessionTitle(messages: UIMessage[]): string {
  const firstUserText = messages
    .find((m) => m.role === "user")
    ?.parts.find(
      (p): p is { type: "text"; text: string } => p.type === "text",
    )?.text;
  const trimmed = firstUserText?.trim();
  if (!trimmed) return "New chat";
  return trimmed.length > 28 ? `${trimmed.slice(0, 28)}…` : trimmed;
}

function messageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
}

// A short digest of a few other tabs' conversations, sent alongside a new
// message so the model stays aware of earlier context even though each tab
// shows its own clean, separate thread in the UI.
function buildPriorContext(sessions: ChatSession[], activeId: string): string {
  const others = sessions
    .filter((s) => s.id !== activeId && s.messages.length > 0)
    .slice(-2);
  if (others.length === 0) return "";
  const chunks = others.map((s) => {
    const lines = s.messages
      .map((m) => {
        const text = messageText(m);
        return text
          ? `${m.role === "user" ? "User" : "Assistant"}: ${text}`
          : null;
      })
      .filter((line): line is string => Boolean(line));
    return `[${s.title}]\n${lines.join("\n")}`;
  });
  let combined = chunks.join("\n\n");
  const CAP = 1500;
  if (combined.length > CAP) combined = `…${combined.slice(-CAP)}`;
  return combined;
}

// A tiny external store (same pattern as cart-context.tsx) rather than
// useState+useEffect — the sessions list has to be readable synchronously
// during render for the tab bar, load from localStorage on creation, and be
// mutated from plain function calls instead of component state setters, so
// none of this trips the "no setState in an effect" rule the way a
// useState-backed version did earlier.
function createSessionsStore(storageKey: string) {
  let sessions: ChatSession[];
  let activeId: string;
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    if (
      parsed &&
      Array.isArray(parsed.sessions) &&
      parsed.sessions.length > 0 &&
      typeof parsed.activeId === "string"
    ) {
      sessions = parsed.sessions as ChatSession[];
      activeId = parsed.activeId as string;
    } else {
      const first = createEmptySession();
      sessions = [first];
      activeId = first.id;
    }
  } catch {
    const first = createEmptySession();
    sessions = [first];
    activeId = first.id;
  }

  let snapshot: SessionsSnapshot = {
    activeId,
    tabs: sessions.map((s) => ({ id: s.id, title: s.title })),
  };
  const listeners = new Set<() => void>();

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ activeId, sessions }));
    } catch {
      // Storage full/disabled — tabs still work for this session, just won't survive a reload.
    }
  }

  function notify() {
    snapshot = {
      activeId,
      tabs: sessions.map((s) => ({ id: s.id, title: s.title })),
    };
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): SessionsSnapshot {
      return snapshot;
    },
    getAllSessions(): ChatSession[] {
      return sessions;
    },
    getActiveMessages(): UIMessage[] {
      return sessions.find((s) => s.id === activeId)?.messages ?? [];
    },
    switchTo(id: string) {
      if (id === activeId || !sessions.some((s) => s.id === id)) return;
      activeId = id;
      persist();
      notify();
    },
    createTab() {
      const created = createEmptySession();
      sessions = [...sessions, created].slice(-MAX_SESSIONS);
      activeId = created.id;
      persist();
      notify();
    },
    closeTab(id: string) {
      const remaining = sessions.filter((s) => s.id !== id);
      sessions = remaining.length > 0 ? remaining : [createEmptySession()];
      if (activeId === id) activeId = sessions[sessions.length - 1].id;
      persist();
      notify();
    },
    updateActiveMessages(messages: UIMessage[]) {
      const current = sessions.find((s) => s.id === activeId);
      const trimmed = messages.slice(-MAX_STORED_MESSAGES);
      // Skip the write (and, critically, the notify) when this would just
      // echo back exactly what's already stored — e.g. right after loading
      // a tab's messages into useChat, the resulting effect re-fires with
      // that same data. Notifying subscribers for a genuine no-op risks a
      // cascading update while React is still settling the load itself.
      if (
        current &&
        JSON.stringify(current.messages) === JSON.stringify(trimmed)
      )
        return;
      // This path only ever mirrors useChat's live messages into storage —
      // legitimate "start empty" cases (a new or freshly switched-to tab) go
      // through createTab/switchTo instead. So a non-empty tab suddenly
      // being asked to sync down to zero messages is never something this
      // call should be trusted to do — most likely a component remount (an
      // interrupted dev Fast Refresh, a transient auth re-check) caught
      // useChat's state before it finished loading. Refusing this specific
      // write is what stands between that and silently erasing a real
      // conversation while its tab title survives untouched.
      if (current && current.messages.length > 0 && trimmed.length === 0)
        return;
      sessions = sessions.map((s) =>
        s.id === activeId
          ? {
              ...s,
              messages: trimmed,
              title: s.title === "New chat" ? sessionTitle(messages) : s.title,
            }
          : s,
      );
      persist();
      notify();
    },
  };
}

interface ProductSummary {
  slug: string;
  title: string;
  brand: string;
  price: string;
  rating: number;
  inStock: boolean;
  image?: string;
}

// Minimal **bold** / *emphasis* renderer — the model naturally reaches for
// markdown to highlight names and prices, so we render it instead of either
// showing raw asterisks or trying to train the habit out of the model.
function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const emphasized = match[1] ?? match[2];
    if (emphasized !== undefined) {
      nodes.push(<strong key={key++}>{emphasized}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key++}>{match[3]}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// A full-width photo card rather than a small side thumbnail — the product
// image is the point of showing a result in chat, so it gets to be seen.
function ProductChip({
  product,
  size,
}: {
  product: ProductSummary;
  size: Size;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="block overflow-hidden rounded-lg border border-border bg-white transition-all hover:border-brand hover:shadow-md"
    >
      {product.image && (
        <div
          className={`relative w-full ${size === "full" ? "h-56" : "h-40"} bg-background`}
        >
          <Image
            src={product.image}
            alt=""
            fill
            sizes={size === "full" ? "(max-width: 768px) 50vw, 320px" : "320px"}
            className="object-cover"
          />
        </div>
      )}
      <div className={size === "full" ? "p-4" : "p-3"}>
        <p
          className={`line-clamp-2 font-medium text-foreground ${size === "full" ? "text-base" : "text-sm"}`}
        >
          {product.title}
        </p>
        <p
          className={`mt-1 font-semibold text-price ${size === "full" ? "text-base" : "text-sm"}`}
        >
          {product.price}
        </p>
      </div>
    </Link>
  );
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join("\n\n")
    .trim();
}

interface MessageGroup {
  key: string;
  role: "user" | "assistant";
  messages: UIMessage[];
}

// A client-side tool (e.g. start_checkout) pauses the stream until the UI
// resolves it, and the model's wrap-up text then arrives as a genuinely
// separate follow-up message — which would otherwise render as its own
// bubble *after* the tool's button, reading like "here's a button" followed
// by "here's what that button does" instead of the other way around.
// Grouping consecutive assistant messages into one bubble, with their parts
// reordered accordingly, fixes the reading order without touching the
// (already-correct) single-message case.
function groupMessagesForDisplay(messages: UIMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const last = groups[groups.length - 1];
    if (message.role === "assistant" && last?.role === "assistant") {
      last.messages.push(message);
    } else {
      groups.push({
        key: message.id,
        role: message.role === "user" ? "user" : "assistant",
        messages: [message],
      });
    }
  }
  return groups;
}

// Flattens a group's messages into one part list, text first then tool
// parts last — always, not just when a client tool split the reply across
// messages. The model sometimes calls a tool (e.g. start_checkout) before
// writing its lead-in text even within a single message, which reads just
// as backwards as the multi-message case: "here's a button" followed by
// "here's what that button does" instead of the other way around.
function buildDisplayParts(groupMessages: UIMessage[]) {
  const flat = groupMessages.flatMap((m) => m.parts);
  const order = [
    ...flat.reduce<number[]>((acc, p, i) => (p.type === "text" ? [...acc, i] : acc), []),
    ...flat.reduce<number[]>((acc, p, i) => (p.type.startsWith("tool-") ? [...acc, i] : acc), []),
  ];
  return { flat, order };
}

function MessageActions({
  align,
  text,
  onRetry,
  retryDisabled,
}: {
  align: "left" | "right";
  text: string;
  onRetry?: () => void;
  retryDisabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable/denied (older browser, restricted iframe) —
      // fall back to the classic hidden-textarea + execCommand trick.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        // Nothing more we can do — the user can still select and copy manually.
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={`mt-1 flex gap-1 ${align === "right" ? "justify-end" : "justify-start"}`}
    >
      {text && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy message"}
          title={copied ? "Copied" : "Copy message"}
          className="cursor-pointer rounded p-1 text-gray-400 transition-colors hover:bg-background hover:text-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retryDisabled}
          aria-label="Retry"
          title="Retry"
          className="cursor-pointer rounded p-1 text-gray-400 transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ChatCta({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-buy px-4 py-3 text-sm font-bold text-brand shadow-md transition-all hover:-translate-y-0.5 hover:bg-accent-buy-hover hover:shadow-lg active:translate-y-0"
    >
      {icon}
      {children}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

// Pure, read-only pass over one message's parts: decides which tool-result
// slugs are redundant repeats of a product already shown earlier in the
// same message (e.g. search_products followed by get_product_details for
// the same item), without ever mutating anything the render tree holds on
// to — React Strict Mode double-invokes component renders in dev, so any
// dedup state that a *component* itself wrote to (rather than a plain
// value computed fresh each time) would get corrupted by the second call.
function computeToolOutputOverrides(
  parts: readonly { type: string; state?: string; output?: unknown }[],
) {
  const seen = new Set<string>();
  const overrides = new Map<number, unknown>();
  parts.forEach((part, index) => {
    if (part.state !== "output-available") return;
    if (part.type === "tool-search_products") {
      const data = part.output as { products?: unknown } | undefined;
      if (Array.isArray(data?.products)) {
        const filtered = (data.products as ProductSummary[]).filter(
          (p) => !seen.has(p.slug),
        );
        filtered.forEach((p) => seen.add(p.slug));
        overrides.set(index, { ...data, products: filtered });
      }
    } else if (part.type === "tool-get_product_details") {
      const data = part.output as Record<string, unknown> | undefined;
      const slug = typeof data?.slug === "string" ? data.slug : "";
      if (slug && seen.has(slug)) {
        overrides.set(index, null);
      } else if (slug) {
        seen.add(slug);
      }
    }
  });
  return overrides;
}

interface RemovalConfirmation {
  /** Line ids currently in the cart — the source of truth for whether a removal actually happened. */
  cartLineIds: Set<string>;
  isCancelled: (toolCallId: string) => boolean;
  onConfirm: (lineId: string) => void;
  onCancel: (toolCallId: string) => void;
}

function ToolResult({
  toolName,
  output,
  size,
  toolCallId,
  removal,
}: {
  toolName: string;
  output: unknown;
  size: Size;
  toolCallId: string;
  removal: RemovalConfirmation;
}) {
  if (!output || typeof output !== "object") return null;
  const data = output as Record<string, unknown>;

  if (data.error) {
    return <p className="text-xs text-gray-500 italic">{String(data.error)}</p>;
  }

  if (toolName === "search_products" && Array.isArray(data.products)) {
    const products = (data.products as ProductSummary[]).slice(
      0,
      size === "full" ? 4 : 3,
    );
    if (products.length === 0)
      return <p className="text-xs text-gray-500 italic">No matches found.</p>;
    const twoColumns = size === "full" && products.length > 1;
    return (
      <div
        className={`mt-1.5 grid gap-2 ${twoColumns ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {products.map((p) => (
          <ProductChip key={p.slug} product={p} size={size} />
        ))}
      </div>
    );
  }

  if (toolName === "get_product_details" && typeof data.title === "string") {
    return (
      <div className="mt-1.5">
        <ProductChip
          product={{
            slug: String(data.slug ?? ""),
            title: String(data.title),
            brand: String(data.brand ?? ""),
            price: String(data.price ?? ""),
            rating: 0,
            inStock: Boolean(data.inStock),
            image: typeof data.image === "string" ? data.image : undefined,
          }}
          size={size}
        />
      </div>
    );
  }

  if (toolName === "start_checkout") {
    if (data.requiresSignIn) {
      return (
        <ChatCta href="/sign-up" icon={<UserPlus className="h-4 w-4" />}>
          Sign up to continue
        </ChatCta>
      );
    }
    if (typeof data.checkoutUrl === "string") {
      return (
        <ChatCta
          href={data.checkoutUrl}
          icon={<ArrowRight className="h-4 w-4" />}
        >
          Complete your purchase
        </ChatCta>
      );
    }
  }

  if (toolName === "view_cart" && Array.isArray(data.items)) {
    const items = data.items as {
      title: string;
      quantity: number;
      image?: string;
      price?: string;
    }[];
    if (items.length === 0)
      return (
        <p className="text-xs text-gray-500 italic">Your cart is empty.</p>
      );
    return (
      <div className="mt-1.5 grid grid-cols-1 gap-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-lg border border-border bg-white p-2.5"
          >
            {item.image && (
              <Image
                src={item.image}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-md object-cover"
              />
            )}
            <p
              className={`min-w-0 truncate text-foreground ${size === "full" ? "text-sm" : "text-xs"}`}
            >
              {item.title} × {item.quantity}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === "add_to_cart" && data.success) {
    return (
      <p className="mt-1 text-xs text-gray-500">
        Added {String(data.title ?? "item")} to your cart.
      </p>
    );
  }

  if (toolName === "remove_from_cart" && data.requiresConfirmation) {
    const lineId = String(data.lineId ?? "");
    const title = String(data.title ?? "this item");

    // The cart itself is the source of truth for whether the removal
    // actually happened — not a flag the model claims, and not even our own
    // "confirmed" click, in case the same line got removed some other way
    // (e.g. the cart page) in the meantime.
    if (!removal.cartLineIds.has(lineId)) {
      return (
        <p className="mt-1 text-xs text-gray-500">
          Removed {title} from your cart.
        </p>
      );
    }
    if (removal.isCancelled(toolCallId)) {
      return (
        <p className="mt-1 text-xs text-gray-500">Kept {title} in your cart.</p>
      );
    }
    return (
      <div className="mt-1.5 rounded-lg border border-border bg-white p-3">
        <p className="text-sm text-foreground">
          Remove <strong>{title}</strong> from your cart?
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => removal.onConfirm(lineId)}
            className="cursor-pointer rounded-md bg-price px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
          >
            Yes, remove
          </button>
          <button
            type="button"
            onClick={() => removal.onCancel(toolCallId)}
            className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-background"
          >
            No, keep it
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function toolStatusLabel(toolName: string, state: string): string {
  if (state === "output-available" || state === "output-error") return "";
  return TOOL_STATUS_LABELS[toolName] ?? "Working…";
}

async function fetchProduct(slug: string): Promise<Product | null> {
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { product: Product };
  return data.product;
}

// A tiny synthesized "pop" rather than a shipped audio file — cheap, no
// asset to load, and easy to keep deliberately soft. One shared AudioContext
// is reused across opens instead of spinning up a new one per click.
let sharedAudioCtx: AudioContext | null = null;

function playOpenSound() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    sharedAudioCtx ??= new Ctx();
    const ctx = sharedAudioCtx;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.09);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // Sound is a nice-to-have — never let it block opening the widget.
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, isSignedIn, user } = useUser();
  const cart = useCart();

  // "No, keep it" is the only outcome that needs its own flag — "confirmed"
  // is derived straight from the cart (see RemovalConfirmation) so it can
  // never drift from what actually happened.
  const [cancelledRemovals, setCancelledRemovals] = useState<Set<string>>(
    new Set(),
  );
  const cartLineIds = new Set(cart.items.map((item) => item.id));
  const removal: RemovalConfirmation = {
    cartLineIds,
    isCancelled: (toolCallId) => cancelledRemovals.has(toolCallId),
    onConfirm: (lineId) => cart.removeItem(lineId),
    onCancel: (toolCallId) =>
      setCancelledRemovals((prev) => {
        const next = new Set(prev);
        next.add(toolCallId);
        return next;
      }),
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, fullscreen]);

  const {
    messages,
    sendMessage,
    addToolOutput,
    setMessages,
    status,
    error,
    regenerate,
    clearError,
  } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      const { toolName, toolCallId, input: rawInput } = toolCall;

      if (toolName === "view_cart") {
        addToolOutput({
          tool: "view_cart",
          toolCallId,
          output: {
            items: cart.items.map((item: CartLineItem) => ({
              lineId: item.id,
              title: item.title,
              quantity: item.quantity,
              image: item.image,
              price: formatPrice(item.price),
            })),
            subtotal: formatPrice(cart.subtotal),
          },
        });
        return;
      }

      if (toolName === "add_to_cart") {
        const { slug, variantId, quantity } = rawInput as {
          slug: string;
          variantId?: string;
          quantity?: number;
        };
        const product = await fetchProduct(slug);
        if (!product) {
          addToolOutput({
            tool: "add_to_cart",
            toolCallId,
            output: { error: "Product not found." },
          });
          return;
        }
        const variant = variantId
          ? product.variants?.find((v) => v.id === variantId)
          : undefined;
        const lineId = variant ? `${product.id}:${variant.id}` : product.id;
        cart.addLineItem(
          {
            id: lineId,
            productId: product.id,
            variantId: variant?.id,
            slug: product.slug,
            title: product.title,
            variantLabel: variant?.label,
            image: variant?.image ?? product.images[0],
            price: variant?.price ?? product.price,
          },
          quantity ?? 1,
        );
        addToolOutput({
          tool: "add_to_cart",
          toolCallId,
          output: { success: true, title: product.title, lineId },
        });
        return;
      }

      if (toolName === "remove_from_cart") {
        const { lineId } = rawInput as { lineId: string };
        const item = cart.items.find((i) => i.id === lineId);
        if (!item) {
          addToolOutput({
            tool: "remove_from_cart",
            toolCallId,
            output: {
              error: "That item isn't in the cart — nothing to remove.",
            },
          });
          return;
        }
        // Nothing is actually removed here — this only surfaces a Yes/No
        // confirmation in the UI. The real removal (and thus the only
        // trustworthy account of what happened) comes from the button click
        // itself, not from the model narrating an assumed outcome.
        addToolOutput({
          tool: "remove_from_cart",
          toolCallId,
          output: { requiresConfirmation: true, lineId, title: item.title },
        });
        return;
      }

      if (toolName === "start_checkout") {
        if (!isSignedIn) {
          addToolOutput({
            tool: "start_checkout",
            toolCallId,
            output: { requiresSignIn: true },
          });
          return;
        }
        if (cart.items.length === 0) {
          addToolOutput({
            tool: "start_checkout",
            toolCallId,
            output: { error: "The cart is empty — add something first." },
          });
          return;
        }
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          }),
        });
        if (!res.ok) {
          addToolOutput({
            tool: "start_checkout",
            toolCallId,
            output: {
              error:
                "Couldn't start checkout — please try the cart page instead.",
            },
          });
          return;
        }
        const data = (await res.json()) as { url: string };
        addToolOutput({
          tool: "start_checkout",
          toolCallId,
          output: { checkoutUrl: data.url },
        });
      }
    },
  });

  // Tabs are kept in localStorage, scoped per signed-in user (or "guest") so
  // switching accounts on a shared browser never leaks one person's
  // conversation — order details included — into another's chat window.
  // `historyKey` is a plain derived value (not state); the store is memoized
  // per key rather than held in a ref, since reading a ref's `.current`
  // during render is disallowed here. `loadedKeyRef`/`skipNextPersistRef`
  // below just track load progress inside effects/handlers (never during
  // render itself), so the only setState call anywhere in this wiring is
  // useChat's own `setMessages`, exactly as before.
  const historyKey = isLoaded ? `kartify:chat:${user?.id ?? "guest"}` : null;
  const sessionsStore = useMemo(
    () => (historyKey ? createSessionsStore(historyKey) : null),
    [historyKey],
  );

  const sessionsSnapshot = useSyncExternalStore(
    sessionsStore ? sessionsStore.subscribe : () => () => {},
    sessionsStore ? sessionsStore.getSnapshot : () => EMPTY_SESSIONS_SNAPSHOT,
    () => EMPTY_SESSIONS_SNAPSHOT,
  );

  const loadedKeyRef = useRef<string | null>(null);
  // Guards the one render between "load effect calls setMessages" and "that
  // update actually lands in `messages`" — without it, the sync-back effect
  // below fires first with the still-stale `messages` from before the load
  // (or from the previous tab, when switching), and would overwrite the
  // real, just-loaded history for this tab.
  const skipNextPersistRef = useRef(false);

  useEffect(() => {
    if (!sessionsStore || loadedKeyRef.current === historyKey) return;
    loadedKeyRef.current = historyKey;
    skipNextPersistRef.current = true;
    setMessages(sessionsStore.getActiveMessages());
  }, [sessionsStore, historyKey, setMessages]);

  useEffect(() => {
    if (!sessionsStore) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    sessionsStore.updateActiveMessages(messages);
  }, [sessionsStore, messages]);

  function handleToggle() {
    // Side effects (starting a new tab, calling another hook's setState)
    // must not live inside the setOpen updater callback — React treats that
    // callback as required to be pure and may invoke it more than once (it
    // does, deliberately, under Strict Mode in dev), which is exactly what
    // was producing "Cannot update a component while rendering a different
    // component": setMessages was firing from inside React's own state-
    // update bookkeeping rather than as a plain, single, direct call.
    const next = !open;
    setOpen(next);
    if (next) {
      playOpenSound();
      // Each open starts a fresh tab — but only if the current one has
      // actually been used, so idly opening and closing the widget can't
      // spam empty tabs.
      if (sessionsStore && sessionsStore.getActiveMessages().length > 0) {
        skipNextPersistRef.current = true;
        sessionsStore.createTab();
        setMessages([]);
      }
    }
  }

  function handleSwitchTab(id: string) {
    if (!sessionsStore || id === sessionsSnapshot.activeId) return;
    skipNextPersistRef.current = true;
    sessionsStore.switchTo(id);
    setMessages(sessionsStore.getActiveMessages());
  }

  function handleNewTab() {
    if (!sessionsStore) return;
    skipNextPersistRef.current = true;
    sessionsStore.createTab();
    setMessages([]);
  }

  function handleCloseTab(id: string) {
    if (!sessionsStore) return;
    const wasActive = sessionsSnapshot.activeId === id;
    sessionsStore.closeTab(id);
    if (wasActive) {
      skipNextPersistRef.current = true;
      setMessages(sessionsStore.getActiveMessages());
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    const priorContext = sessionsStore
      ? buildPriorContext(
          sessionsStore.getAllSessions(),
          sessionsSnapshot.activeId,
        )
      : "";
    sendMessage(
      { text },
      priorContext ? { body: { priorContext } } : undefined,
    );
    setInput("");
  }

  const size: Size = fullscreen ? "full" : "compact";

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={
          open ? "Close shopping assistant" : "Open shopping assistant"
        }
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-accent-buy text-brand shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <span
          className={`transition-transform duration-200 ${open ? "rotate-90" : "rotate-0"}`}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </span>
      </button>

      {open && (
        <div
          className={`animate-chat-pop-in fixed z-50 flex origin-bottom-right flex-col overflow-hidden border border-border bg-white shadow-2xl transition-[width,height] duration-300 ${
            fullscreen
              ? "inset-4 rounded-xl sm:inset-8"
              : "right-5 bottom-24 h-[32rem] w-96 max-w-[calc(100vw-2.5rem)] rounded-lg"
          }`}
        >
          <div
            className={`flex items-center justify-between bg-brand text-white ${fullscreen ? "px-6 py-4" : "px-4 py-3"}`}
          >
            <div>
              <p
                className={
                  fullscreen ? "text-lg font-semibold" : "font-semibold"
                }
              >
                Kartify Assistant
              </p>
              <p
                className={`text-gray-300 ${fullscreen ? "text-sm" : "text-xs"}`}
              >
                Ask me to find products, check orders, and more
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFullscreen((value) => !value)}
              aria-label={
                fullscreen ? "Exit full screen" : "Expand to full screen"
              }
              className="cursor-pointer rounded-md p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {fullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
          </div>

          {sessionsStore && !fullscreen && (
            <div className="overlay-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-border bg-background/60 px-3 pt-1.5 pb-2">
              {sessionsSnapshot.tabs.map((tab) => {
                const active = tab.id === sessionsSnapshot.activeId;
                return (
                  <div
                    key={tab.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSwitchTab(tab.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ")
                        handleSwitchTab(tab.id);
                    }}
                    className={`flex shrink-0 cursor-pointer items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-xs font-medium transition-colors ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-white text-gray-500 hover:border-brand/40 hover:text-foreground"
                    }`}
                  >
                    <span className="max-w-[7rem] truncate">{tab.title}</span>
                    {sessionsSnapshot.tabs.length > 1 && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCloseTab(tab.id);
                        }}
                        aria-label={`Close ${tab.title}`}
                        className={`cursor-pointer rounded-full p-0.5 ${active ? "hover:bg-white/20" : "hover:bg-background"}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleNewTab}
                aria-label="Start a new chat"
                title="New chat"
                className="ml-0.5 shrink-0 cursor-pointer rounded-full border border-dashed border-border p-1 text-gray-400 transition-colors hover:border-brand hover:text-brand"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex min-h-0 flex-1">
            {sessionsStore && fullscreen && (
              <div className="flex w-56 shrink-0 flex-col border-r border-border bg-background/60">
                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleNewTab}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-brand hover:text-brand"
                  >
                    <Plus className="h-4 w-4" />
                    New chat
                  </button>
                </div>
                <div className="overlay-scrollbar flex-1 space-y-1 overflow-y-auto px-2 pb-2">
                  {sessionsSnapshot.tabs.map((tab) => {
                    const active = tab.id === sessionsSnapshot.activeId;
                    return (
                      <div
                        key={tab.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSwitchTab(tab.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ")
                            handleSwitchTab(tab.id);
                        }}
                        className={`group flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-brand text-white"
                            : "text-foreground hover:bg-white"
                        }`}
                      >
                        <span className="truncate">{tab.title}</span>
                        {sessionsSnapshot.tabs.length > 1 && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCloseTab(tab.id);
                            }}
                            aria-label={`Close ${tab.title}`}
                            className={`shrink-0 cursor-pointer rounded-full p-0.5 opacity-0 group-hover:opacity-100 ${
                              active
                                ? "hover:bg-white/20"
                                : "hover:bg-background"
                            }`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              <div
                className={`mx-auto flex w-full flex-1 flex-col overflow-y-auto ${
                  fullscreen ? "max-w-3xl space-y-5 p-6" : "space-y-3 p-4"
                }`}
              >
                {messages.length === 0 && (
                  <p
                    className={
                      fullscreen
                        ? "text-base text-gray-500"
                        : "text-sm text-gray-500"
                    }
                  >
                    Hi! I can help you find products, answer questions about
                    them, add things to your cart, and check out. What are you
                    looking for?
                  </p>
                )}
                {(() => {
                  const groups = groupMessagesForDisplay(messages);
                  const isBusy =
                    status === "streaming" || status === "submitted";
                  return groups.map((group, groupIndex) => {
                    const isLastGroup = groupIndex === groups.length - 1;
                    const canRetry = group.role === "assistant" || isLastGroup;
                    const { flat, order } = buildDisplayParts(group.messages);
                    // Recomputed fresh every render (pure function of this
                    // group's parts) — see computeToolOutputOverrides for why
                    // this can't be a mutable Set threaded through ToolResult.
                    const toolOutputOverrides = computeToolOutputOverrides(
                      flat as unknown as {
                        type: string;
                        state?: string;
                        output?: unknown;
                      }[],
                    );
                    return (
                      <div
                        key={group.key}
                        className={
                          group.role === "user" ? "text-right" : "text-left"
                        }
                      >
                        <div
                          className={`inline-block rounded-lg text-left ${
                            group.role === "user"
                              ? "max-w-[85%]"
                              : "max-w-[95%]"
                          } ${fullscreen ? "px-4 py-3 text-base" : "px-3 py-2 text-sm"} ${
                            group.role === "user"
                              ? "bg-accent-buy text-brand"
                              : "bg-background text-foreground"
                          }`}
                        >
                          {order.map((index) => {
                            const part = flat[index];
                            if (part.type === "text") {
                              return (
                                <span
                                  key={index}
                                  className="whitespace-pre-wrap"
                                >
                                  {renderInlineMarkdown(part.text)}
                                </span>
                              );
                            }
                            if (part.type.startsWith("tool-")) {
                              const toolName = part.type.slice("tool-".length);
                              const toolPart = part as {
                                state: string;
                                output?: unknown;
                                toolCallId: string;
                              };
                              const label = toolStatusLabel(
                                toolName,
                                toolPart.state,
                              );
                              const output = toolOutputOverrides.has(index)
                                ? toolOutputOverrides.get(index)
                                : toolPart.output;
                              return (
                                <div key={index}>
                                  {label && (
                                    <span className="block text-xs text-gray-500 italic">
                                      {label}
                                    </span>
                                  )}
                                  {toolPart.state === "output-available" &&
                                    output !== null && (
                                      <ToolResult
                                        toolName={toolName}
                                        output={output}
                                        size={size}
                                        toolCallId={toolPart.toolCallId}
                                        removal={removal}
                                      />
                                    )}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                        <MessageActions
                          align={group.role === "user" ? "right" : "left"}
                          text={group.messages
                            .map(getMessageText)
                            .filter(Boolean)
                            .join("\n\n")}
                          retryDisabled={isBusy}
                          onRetry={
                            canRetry
                              ? () => {
                                  if (group.role === "assistant") {
                                    regenerate({
                                      messageId: group.messages[0].id,
                                    });
                                  } else {
                                    regenerate();
                                  }
                                }
                              : undefined
                          }
                        />
                      </div>
                    );
                  });
                })()}
                {status === "submitted" && (
                  <p className="text-sm text-gray-400 italic">Thinking…</p>
                )}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <p>
                      Something went wrong reaching the assistant. Please try
                      again in a moment.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        clearError();
                        regenerate();
                      }}
                      className="mt-1 cursor-pointer font-semibold underline hover:no-underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className={`mx-auto flex w-full gap-2 border-t border-border ${fullscreen ? "max-w-3xl p-4" : "p-3"}`}
              >
                <label htmlFor="chat-input" className="sr-only">
                  Message
                </label>
                <input
                  id="chat-input"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about products, orders…"
                  disabled={status === "streaming" || status === "submitted"}
                  className={`input-field ${fullscreen ? "!py-3 !text-base" : ""}`}
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={
                    status === "streaming" ||
                    status === "submitted" ||
                    !input.trim()
                  }
                  className={`cursor-pointer rounded-md bg-accent-buy text-brand transition-colors hover:bg-accent-buy-hover disabled:cursor-not-allowed disabled:opacity-50 ${fullscreen ? "p-3.5" : "p-2"}`}
                >
                  <Send className={fullscreen ? "h-5 w-5" : "h-4 w-4"} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
