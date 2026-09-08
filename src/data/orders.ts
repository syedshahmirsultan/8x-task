import { products } from "./products";
import type { Order } from "./types";

const headphones = products.find((p) => p.id === "p-wireless-headphones")!;
const airFryer = products.find((p) => p.id === "p-air-fryer")!;
const novel = products.find((p) => p.id === "p-scifi-novel")!;
const yogaMat = products.find((p) => p.id === "p-yoga-mat")!;

// Purely illustrative order history so the account page isn't empty on a
// first visit — real orders placed through checkout are stored separately
// (see lib/orders-store.ts) and shown alongside these.
export const seedOrders: Order[] = [
  {
    id: "ORD-7K2N9P3X",
    date: "2026-08-21T14:32:00.000Z",
    status: "Delivered",
    items: [
      { title: airFryer.title, quantity: 1, price: airFryer.price, image: airFryer.images[0] },
      { title: novel.title, quantity: 2, price: novel.price, image: novel.images[0] },
    ],
    total: airFryer.price + novel.price * 2,
  },
  {
    id: "ORD-4M8Q1L6D",
    date: "2026-07-03T09:15:00.000Z",
    status: "Delivered",
    items: [
      { title: headphones.title, quantity: 1, price: headphones.price, image: headphones.images[0] },
      { title: yogaMat.title, quantity: 1, price: yogaMat.price, image: yogaMat.images[0] },
    ],
    total: headphones.price + yogaMat.price,
  },
];
