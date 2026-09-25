// The store's real catalog — 20 products across the 6 categories, each with
// 2-3 versions. Photos are free-license Unsplash images, each hand-checked
// to show the product it's attached to; every version has its own photo,
// and a product's gallery is its versions' photos.
// Loaded into an empty database by `npm run db:seed`; after that the admin
// panel is the source of truth — edit products in /admin, not here.

import type { Category } from "@/data/types";

/** Unsplash CDN URL, square-cropped for product tiles. */
const img = (id: string) => `https://images.unsplash.com/${id}?w=1000&h=1000&fit=crop&q=80`;

export interface CatalogVariant {
  label: string;
  /** Cents. */
  price: number;
  stock: number;
  image: string;
}

export interface CatalogProduct {
  slug: string;
  title: string;
  brand: string;
  categoryId: string;
  /** Cents; struck through on product cards when higher than the first version's price. */
  compareAtPrice?: number;
  description: string;
  bullets: string[];
  variants: CatalogVariant[];
}

export const catalog: CatalogProduct[] = [
  // ─── Electronics ───────────────────────────────────────────────
  {
    slug: "orbit-s2-smartwatch",
    title: "Orbit S2 Smartwatch with Heart Rate & GPS",
    brand: "Orbit",
    categoryId: "electronics",
    compareAtPrice: 24999,
    description:
      "A bright always-on AMOLED smartwatch that tracks workouts, heart rate, blood oxygen and sleep, with built-in GPS so you can leave your phone at home on runs.",
    bullets: [
      '1.9" always-on AMOLED display, readable in direct sunlight',
      "Built-in GPS plus 24/7 heart rate, SpO2 and sleep tracking",
      "Up to 7 days of battery; 30-minute fast charge to 80%",
      "Water resistant to 50 m — safe for swimming",
      "Works with iPhone and Android",
    ],
    variants: [
      { label: "Midnight Black", price: 19999, stock: 25, image: img("photo-1546868871-7041f2a55e12") },
      { label: "Arctic White", price: 19999, stock: 18, image: img("photo-1617043983671-adaadcaa2460") },
      { label: "Saddle Leather", price: 22999, stock: 10, image: img("photo-1461141346587-763ab02bced9") },
    ],
  },
  {
    slug: "hushwave-700-noise-cancelling-headphones",
    title: "Hushwave 700 Wireless Noise-Cancelling Headphones",
    brand: "Hushwave",
    categoryId: "electronics",
    compareAtPrice: 22999,
    description:
      "Over-ear wireless headphones with adaptive noise cancelling, plush memory-foam cushions and a 40-hour battery — built for flights, commutes and long work sessions.",
    bullets: [
      "Adaptive active noise cancelling with transparency mode",
      "Up to 40 hours of playback; 10 minutes of charging adds 5 hours",
      "Bluetooth 5.3 with multipoint pairing for two devices at once",
      "Memory-foam ear cushions and a foldable design with travel case",
    ],
    variants: [
      { label: "Onyx Black", price: 17999, stock: 30, image: img("photo-1618366712010-f4ae9c647dcb") },
      { label: "Sandstone", price: 17999, stock: 20, image: img("photo-1545127398-14699f92334b") },
      { label: "Blush Pink", price: 18999, stock: 12, image: img("photo-1613040809024-b4ef7ba99bc3") },
    ],
  },
  {
    slug: "nova-x-5g-smartphone",
    title: 'Nova X 5G Smartphone, 6.1" OLED, Triple Camera',
    brand: "Nova",
    categoryId: "electronics",
    description:
      "A compact flagship phone with a 6.1-inch OLED display, a 50 MP triple camera system and all-day battery life, in a slim glass-and-aluminium body.",
    bullets: [
      '6.1" 120 Hz OLED display',
      "50 MP main, 12 MP ultra-wide and 10 MP telephoto cameras",
      "5G, Wi-Fi 6E and wireless charging",
      "IP68 dust and water resistance",
      "Unlocked — works with all major carriers",
    ],
    variants: [
      { label: "Graphite / 128GB", price: 69999, stock: 22, image: img("photo-1512941937669-90a1b58e7e9c") },
      { label: "Silver / 256GB", price: 79999, stock: 15, image: img("photo-1523206489230-c012c64b2b48") },
      { label: "Starlight / 512GB", price: 94999, stock: 8, image: img("photo-1580910051074-3eb694886505") },
    ],
  },
  {
    slug: "lumen-book-14-ultrabook",
    title: "Lumen Book 14 Ultrabook Laptop",
    brand: "Lumen",
    categoryId: "electronics",
    description:
      "A thin, 1.2 kg aluminium laptop with a sharp 14-inch display, a fast SSD and up to 18 hours of battery — enough power for work and study without the weight.",
    bullets: [
      '14" 2.8K display with 100% sRGB colour',
      "Up to 18 hours of battery life with USB-C fast charging",
      "Backlit keyboard and large glass trackpad",
      "Two Thunderbolt 4 ports, headphone jack, Wi-Fi 6E",
      "All-aluminium body weighing just 1.2 kg",
    ],
    variants: [
      { label: "Silver / 16GB / 512GB", price: 99999, stock: 14, image: img("photo-1611186871348-b1ce696e52c9") },
      { label: "Space Gray / 16GB / 512GB", price: 99999, stock: 12, image: img("photo-1531297484001-80022131f5a1") },
      { label: "Silver / 32GB / 1TB", price: 139999, stock: 6, image: img("photo-1541807084-5c52b6b3adef") },
    ],
  },
  {
    slug: "resonix-portable-bluetooth-speaker",
    title: "Resonix Waterproof Portable Bluetooth Speaker",
    brand: "Resonix",
    categoryId: "electronics",
    description:
      "Rugged waterproof Bluetooth speakers with deep bass for the beach, the park or the shower. Choose the full-size Boom, the palm-sized Pebble or the clip-on Mini.",
    bullets: [
      "IP67 waterproof and dustproof",
      "Up to 20 hours of playtime (Boom), 12 hours (Pebble, Mini)",
      "Pair two speakers together for stereo sound",
      "Built-in microphone for hands-free calls",
    ],
    variants: [
      { label: "Boom — Black", price: 12999, stock: 20, image: img("photo-1608043152269-423dbba4e7e1") },
      { label: "Pebble — Stone Gray", price: 7999, stock: 26, image: img("photo-1547052178-7f2c5a20c332") },
      { label: "Clip Mini — Black & Orange", price: 4999, stock: 35, image: img("photo-1588131153911-a4ea5189fe19") },
    ],
  },

  // ─── Home & Kitchen ────────────────────────────────────────────
  {
    slug: "casa-crema-barista-espresso-machine",
    title: "Casa Crema Barista Espresso Machine with Steam Wand",
    brand: "Casa Crema",
    categoryId: "home-kitchen",
    compareAtPrice: 52999,
    description:
      "A 15-bar semi-automatic espresso machine with a commercial-style steam wand, so you can pull café-quality shots and texture silky milk for lattes at home.",
    bullets: [
      "15-bar pump with precise PID temperature control",
      "Commercial-style steam wand for latte art",
      "58 mm stainless-steel portafilter with single and double baskets",
      "Removable 2 L water tank and cup-warming tray",
    ],
    variants: [
      { label: "Brushed Steel", price: 44999, stock: 9, image: img("photo-1620807773206-49c1f2957417") },
      { label: "Cream White", price: 46999, stock: 6, image: img("photo-1637029436347-e33bf98a5412") },
      { label: "Matte Black", price: 44999, stock: 7, image: img("photo-1608354580875-30bd4168b351") },
    ],
  },
  {
    slug: "hearth-clay-stoneware-mug-set",
    title: "Hearth & Clay Stoneware Coffee Mugs, Set of 4 (12 oz)",
    brand: "Hearth & Clay",
    categoryId: "home-kitchen",
    description:
      "Hand-glazed stoneware mugs with a comfortable handle and a 12 oz capacity — sturdy enough for everyday coffee and tea, and pretty enough to gift.",
    bullets: [
      "Set of 4 mugs, 12 oz (350 ml) each",
      "Durable, chip-resistant glazed stoneware",
      "Dishwasher and microwave safe (except Gold Handle)",
      "Lead- and cadmium-free glaze",
    ],
    variants: [
      { label: "Chalk White", price: 3499, stock: 40, image: img("photo-1616241673111-508b4662c707") },
      { label: "White with Gold Handle", price: 4499, stock: 18, image: img("photo-1520485521983-bfaa0bc6c80e") },
      { label: "Blush Pink", price: 3499, stock: 25, image: img("photo-1555447014-7ead71574544") },
    ],
  },
  {
    slug: "kettleworks-electric-kettle-1-7l",
    title: "Kettleworks 1.7L Rapid-Boil Electric Kettle",
    brand: "Kettleworks",
    categoryId: "home-kitchen",
    description:
      "A fast-boiling 1.7-litre electric kettle with auto shut-off and boil-dry protection, on a 360° cordless base.",
    bullets: [
      "Boils a full 1.7 L in about 4 minutes (1500 W)",
      "Auto shut-off and boil-dry protection",
      "BPA-free, with a stainless-steel heating plate",
      "360° swivel base with cord storage",
    ],
    variants: [
      { label: "Glass with Blue LED", price: 4999, stock: 22, image: img("photo-1643114786355-ff9e52736eab") },
      { label: "Gloss White", price: 3999, stock: 30, image: img("photo-1685514128186-c5d8d7e90e1a") },
      { label: "Matte Black", price: 5499, stock: 16, image: img("photo-1748408082799-94daff13e792") },
    ],
  },
  {
    slug: "lumora-nordic-table-lamp",
    title: "Lumora Nordic Bedside Table Lamp",
    brand: "Lumora",
    categoryId: "home-kitchen",
    description:
      "A warm, minimalist table lamp with a soft fabric shade that gives bedrooms and living rooms a calm, cozy glow. LED bulb included.",
    bullets: [
      "Warm-white 2700K LED bulb included",
      "Linen fabric shade diffuses light evenly",
      "Inline on/off switch on a 1.8 m cord",
      "Approx. 45 cm tall",
    ],
    variants: [
      { label: "Oak Tripod", price: 6999, stock: 14, image: img("photo-1517991104123-1d56a6e81ed9") },
      { label: "Ceramic Sand", price: 5999, stock: 20, image: img("photo-1580130281320-0ef0754f2bf7") },
      { label: "Bronze Base", price: 7999, stock: 9, image: img("photo-1573676386604-78f8ed228e2b") },
    ],
  },

  // ─── Fashion ───────────────────────────────────────────────────
  {
    slug: "stride-everyday-sneakers",
    title: "Stride Everyday Low-Top Sneakers",
    brand: "Stride",
    categoryId: "fashion",
    description:
      "Clean, versatile low-top sneakers with a cushioned insole and a grippy rubber sole — comfortable enough to wear all day, easy to dress up or down.",
    bullets: [
      "Cushioned, removable memory-foam insole",
      "Durable non-slip rubber outsole",
      "Breathable lining keeps feet cool",
      "True to size — order your usual size",
    ],
    variants: [
      { label: "Cloud White", price: 8999, stock: 34, image: img("photo-1608231387042-66d1773070a5") },
      { label: "Desert Tan", price: 9499, stock: 20, image: img("photo-1549298916-b41d501d3772") },
      { label: "Rose Grey", price: 8999, stock: 18, image: img("photo-1551107696-a4b0c5a0d9a2") },
    ],
  },
  {
    slug: "atelier-row-leather-backpack",
    title: "Atelier Row Full-Grain Leather Backpack",
    brand: "Atelier Row",
    categoryId: "fashion",
    compareAtPrice: 15999,
    description:
      'A timeless full-grain leather backpack with a padded 15" laptop sleeve — it softens and develops a rich patina the more you carry it.',
    bullets: [
      "Full-grain leather with brass hardware",
      'Padded sleeve fits laptops up to 15"',
      "Interior zip pocket and two front pockets",
      "Adjustable padded shoulder straps",
    ],
    variants: [
      { label: "Burgundy", price: 12999, stock: 10, image: img("photo-1622560480654-d96214fdc887") },
      { label: "Rosewood Brown", price: 12999, stock: 14, image: img("photo-1622560480605-d83c853bc5c3") },
      { label: "Black", price: 13999, stock: 11, image: img("photo-1680039211156-66c721b87625") },
    ],
  },
  {
    slug: "solace-coastline-polarized-sunglasses",
    title: "Solace Coastline Polarized Sunglasses",
    brand: "Solace",
    categoryId: "fashion",
    description:
      "Classic square-frame sunglasses with polarized, 100% UV400 lenses that cut glare on the road, at the beach or on the water.",
    bullets: [
      "Polarized lenses reduce glare",
      "100% UV400 protection",
      "Lightweight acetate frame with metal hinges",
      "Includes hard case and cleaning cloth",
    ],
    variants: [
      { label: "Classic Black", price: 5999, stock: 30, image: img("photo-1572635196237-14b3f281503f") },
      { label: "Crystal Clear / Brown Lens", price: 5999, stock: 16, image: img("photo-1508296695146-257a814070b4") },
      { label: "Tortoiseshell", price: 6499, stock: 19, image: img("photo-1559070081-648fb00b2ed1") },
    ],
  },

  // ─── Beauty & Personal Care ────────────────────────────────────
  {
    slug: "maison-elan-eau-de-parfum",
    title: "Maison Élan Signature Eau de Parfum, 50 ml",
    brand: "Maison Élan",
    categoryId: "beauty",
    description:
      "Long-lasting eau de parfum in three signature scents — a soft floral, a bright citrus and a warm amber — each in an elegant glass bottle.",
    bullets: [
      "Rose Bloom: rose, peony and white musk",
      "Fresh Citrus: bergamot, neroli and vetiver",
      "Amber Night: amber, vanilla and sandalwood",
      "50 ml eau de parfum, lasts 6-8 hours",
    ],
    variants: [
      { label: "Rose Bloom", price: 8999, stock: 22, image: img("photo-1458538977777-0549b2370168") },
      { label: "Fresh Citrus", price: 7999, stock: 25, image: img("photo-1594125311687-3b1b3eafa9f4") },
      { label: "Amber Night", price: 9999, stock: 15, image: img("photo-1588405748880-12d1d2a59f75") },
    ],
  },
  {
    slug: "rouge-atelier-satin-matte-lipstick",
    title: "Rouge Atelier Satin Matte Lipstick",
    brand: "Rouge Atelier",
    categoryId: "beauty",
    description:
      "A creamy, highly pigmented lipstick with a comfortable satin-matte finish that doesn't dry out lips — rich color in a single swipe.",
    bullets: [
      "Full-coverage color in one swipe",
      "Satin-matte finish enriched with vitamin E and shea butter",
      "Long-wearing, up to 8 hours",
      "Cruelty-free",
    ],
    variants: [
      { label: "Ruby Red", price: 2499, stock: 45, image: img("photo-1626895872564-b691b6877b83") },
      { label: "Rosewood", price: 2499, stock: 38, image: img("photo-1625093742435-6fa192b6fb10") },
      { label: "Crimson Gold (Limited)", price: 2999, stock: 20, image: img("photo-1619352520578-8fefbfa2f904") },
    ],
  },
  {
    slug: "dermaleaf-face-serum-30ml",
    title: "Dermaleaf Concentrated Face Serum, 30 ml",
    brand: "Dermaleaf",
    categoryId: "beauty",
    description:
      "Lightweight, fast-absorbing face serums with a glass dropper — pick the formula for your skin: brightening, hydrating or overnight renewal.",
    bullets: [
      "Vitamin C: 15% vitamin C for brighter, more even skin",
      "Hyaluronic Acid: multi-weight HA for deep, lasting hydration",
      "Retinol Night: 0.3% encapsulated retinol to smooth fine lines",
      "Fragrance-free, dermatologist tested",
    ],
    variants: [
      { label: "Vitamin C Brightening", price: 2999, stock: 40, image: img("photo-1713768704571-6aeb0d0e5105") },
      { label: "Hyaluronic Acid Hydrating", price: 2799, stock: 36, image: img("photo-1576426863848-c21f53c60b19") },
      { label: "Retinol Night Renewal", price: 3499, stock: 24, image: img("photo-1715750968540-841103c78d47") },
    ],
  },

  // ─── Sports & Outdoors ─────────────────────────────────────────
  {
    slug: "flowform-align-yoga-mat",
    title: "Flowform Align Non-Slip Yoga Mat",
    brand: "Flowform",
    categoryId: "sports-outdoors",
    description:
      "A grippy, cushioned yoga mat that stays put through sweaty flows and protects your joints on hard floors. Carry strap included.",
    bullets: [
      "Non-slip textured surface on both sides",
      "183 × 61 cm, in 4 mm or 6 mm thickness",
      "Eco-friendly, phthalate-free TPE",
      "Lightweight with carry strap",
    ],
    variants: [
      { label: "Sage Green — 4 mm", price: 3999, stock: 30, image: img("photo-1646239646963-b0b9be56d6b5") },
      { label: "Sage Green — 6 mm", price: 4599, stock: 22, image: img("photo-1637157216470-d92cd2edb2e8") },
      { label: "Ocean Blue — 6 mm", price: 4599, stock: 18, image: img("photo-1718862403436-616232ec6005") },
    ],
  },
  {
    slug: "ironcore-hex-rubber-dumbbells",
    title: "IronCore Hex Rubber Dumbbells (Pair)",
    brand: "IronCore",
    categoryId: "sports-outdoors",
    description:
      "Rubber-encased hex dumbbells that won't roll away or scuff your floor, with a knurled chrome handle for a secure grip. Sold as a pair.",
    bullets: [
      "Sold as a pair",
      "Hexagonal heads stop rolling",
      "Rubber coating protects floors and cuts noise",
      "Knurled chrome-plated steel handles",
    ],
    variants: [
      { label: "5 kg pair", price: 3999, stock: 25, image: img("photo-1638536532686-d610adfc8e5c") },
      { label: "10 kg pair", price: 6999, stock: 18, image: img("photo-1638536534984-0d98ccdb6af5") },
      { label: "15 kg pair", price: 9999, stock: 10, image: img("photo-1623874228601-f4193c7b1818") },
    ],
  },
  {
    slug: "hydrapeak-insulated-water-bottle-750ml",
    title: "HydraPeak Insulated Stainless-Steel Water Bottle, 750 ml",
    brand: "HydraPeak",
    categoryId: "sports-outdoors",
    description:
      "A double-wall vacuum-insulated bottle that keeps drinks cold for 24 hours or hot for 12 — leak-proof for the gym bag, the trail or the office.",
    bullets: [
      "Keeps drinks cold 24 h / hot 12 h",
      "18/8 food-grade stainless steel, BPA-free",
      "Leak-proof screw cap",
      "Sweat-free powder-coated finish",
    ],
    variants: [
      { label: "Sage", price: 2999, stock: 40, image: img("photo-1602143407151-7111542de6e8") },
      { label: "Graphite", price: 2999, stock: 35, image: img("photo-1544003484-3cd181d17917") },
      { label: "Lagoon Blue", price: 2999, stock: 28, image: img("photo-1568395216634-ab1b1e848751") },
    ],
  },

  // ─── Books ─────────────────────────────────────────────────────
  {
    slug: "the-lighthouse-at-wrens-end",
    title: "The Lighthouse at Wren's End: A Novel",
    brand: "Clara Wynn",
    categoryId: "books",
    description:
      "When a young archivist inherits a shuttered lighthouse on a remote northern coast, she uncovers letters that rewrite everything her family believed about the night the light went dark. A moving, atmospheric story of secrets, grief and second chances.",
    bullets: [
      "Hardcover: 384 pages",
      "Paperback: 400 pages",
      "Collector's Edition: cloth-bound with sprayed edges and a signed bookplate",
      "Book club discussion guide included",
    ],
    variants: [
      { label: "Hardcover", price: 2499, stock: 30, image: img("photo-1485990005353-9abcf694f3e7") },
      { label: "Paperback", price: 1499, stock: 50, image: img("photo-1614983099486-fd0ef224a916") },
      { label: "Collector's Edition", price: 3999, stock: 10, image: img("photo-1654124803533-a51f169e1971") },
    ],
  },
  {
    slug: "weeknight-kitchen-cookbook",
    title: "Weeknight Kitchen: 120 Simple Recipes for Busy Days",
    brand: "Priya Castell",
    categoryId: "books",
    description:
      "120 fresh, flexible recipes that get dinner on the table in 30 minutes or less, from one-pan pastas to big bright salads — with full-color photos for every dish.",
    bullets: [
      "120 recipes, most ready in 30 minutes or less",
      "Full-color photo for every recipe",
      "Vegetarian and gluten-free options marked throughout",
      "Spiral-bound edition lies flat on the counter",
    ],
    variants: [
      { label: "Hardcover", price: 2999, stock: 25, image: img("photo-1542010589005-d1eacc3918f2") },
      { label: "Paperback", price: 1999, stock: 35, image: img("photo-1627907228175-2bf846a303b4") },
      { label: "Spiral-Bound", price: 2499, stock: 15, image: img("photo-1495546968767-f0573cca821e") },
    ],
  },
];

/** Category tiles use a photo of a product in that category. */
export const catalogCategories: Category[] = [
  { id: "electronics", slug: "electronics", name: "Electronics", image: img("photo-1618366712010-f4ae9c647dcb") },
  { id: "home-kitchen", slug: "home-kitchen", name: "Home & Kitchen", image: img("photo-1620807773206-49c1f2957417") },
  { id: "fashion", slug: "fashion", name: "Fashion", image: img("photo-1608231387042-66d1773070a5") },
  { id: "books", slug: "books", name: "Books", image: img("photo-1485990005353-9abcf694f3e7") },
  { id: "beauty", slug: "beauty", name: "Beauty & Personal Care", image: img("photo-1458538977777-0549b2370168") },
  { id: "sports-outdoors", slug: "sports-outdoors", name: "Sports & Outdoors", image: img("photo-1646239646963-b0b9be56d6b5") },
];
