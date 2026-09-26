import type { Category, Product } from "@/data/types";

// Forgiving product search, shared by the search page, the header
// suggestions and the chat assistant. The old search looked for the whole
// query as one literal substring, so "smart watch" missed "Smartwatch",
// "watches" missed "watch", and any natural sentence ("a wireless headphone
// for the gym") matched nothing. This version matches word by word.
//
// It ranks in memory, which is right for a catalog of this size (tens to low
// hundreds of products); a much larger catalog would want Postgres full-text
// search instead.

/** Words that carry no product meaning in a shopping query. */
const STOPWORDS = new Set(
  (
    "a an the and or of for to in on at by with from my me i im want wanted looking look buy buying need needs " +
    "some any show find get give please something thing things item items product products one ones good best " +
    "nice great new cheap affordable really very that this these those is are be it its do you have has got " +
    "can could would like kind type sort around about under over below above than"
  ).split(" "),
);

/** How much a match in each field counts toward a product's rank. */
const FIELD_WEIGHTS = { title: 5, brand: 4, category: 5, versions: 2, features: 1.5, description: 1 } as const;

/**
 * Everyday shopping words and the words products actually use. Kept generic
 * (not tied to specific products) so it keeps working as the catalog changes.
 * Keys and values are singular, stemmed forms.
 */
const SYNONYMS: Record<string, string[]> = {
  shoe: ["sneaker", "trainer", "footwear"],
  sneaker: ["shoe", "trainer"],
  trainer: ["sneaker", "shoe"],
  perfume: ["parfum", "fragrance", "cologne", "scent"],
  fragrance: ["parfum", "perfume", "cologne", "scent"],
  cologne: ["parfum", "fragrance", "perfume"],
  scent: ["parfum", "fragrance", "perfume"],
  phone: ["smartphone"],
  mobile: ["smartphone"],
  cellphone: ["smartphone"],
  earphone: ["headphone", "earbud", "headset"],
  earbud: ["headphone", "earphone"],
  headset: ["headphone"],
  laptop: ["notebook", "ultrabook"],
  notebook: ["laptop", "ultrabook"],
  computer: ["laptop", "ultrabook"],
  watch: ["smartwatch"],
  coffee: ["espresso", "barista"],
  weight: ["dumbbell"],
  gym: ["fitness", "workout", "dumbbell"],
  workout: ["fitness", "gym"],
  bag: ["backpack"],
  shade: ["sunglasses"],
  novel: ["book"],
  cookbook: ["recipe", "book"],
  cup: ["mug"],
  lamp: ["light"],
  speaker: ["bluetooth", "audio"],
  makeup: ["lipstick", "beauty"],
  skincare: ["serum", "beauty"],
};

/** A match inside a longer word ("phone" in "headphones") counts less than a whole-word one. */
const SUBSTRING_MATCH = 0.6;

/** Results scoring below this fraction of the best match are dropped as incidental. */
const MIN_RELATIVE_SCORE = 0.35;
type Field = keyof typeof FIELD_WEIGHTS;
const ALL_FIELDS = Object.keys(FIELD_WEIGHTS) as Field[];
/** Fields that say what a product *is*, as opposed to copy that merely mentions things. */
const IDENTITY_FIELDS: readonly Field[] = ["title", "brand", "category", "versions"];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Crude English singulariser — enough for "watches", "batteries", "mugs". */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(sh|ch|x|ss|z)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us")) return word.slice(0, -1);
  return word;
}

function words(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean).map(stem);
}

/** Edit distance, capped: returns early once it exceeds `max`. */
function withinEdits(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return false;
    previous = current;
  }
  return previous[b.length] <= max;
}

interface IndexedField {
  words: string[];
  /** The field with spaces removed, so "smart watch" can find "smartwatch". */
  compact: string;
}

function indexField(text: string): IndexedField {
  const fieldWords = words(text);
  return { words: fieldWords, compact: fieldWords.join("") };
}

/** 1 for a whole-word, prefix or one-typo match; less for a match inside a longer word; 0 for none. */
function fieldMatch(field: IndexedField, token: string, allowTypo: boolean): number {
  const wordMatch = field.words.some(
    (word) =>
      word === token ||
      // Prefixes need a few letters — "wat" (a typo of "want") mustn't match "waterproof".
      (token.length >= 4 && word.startsWith(token)) ||
      // One typo allowed in longer words ("headphons" → "headphones").
      (allowTypo && token.length >= 5 && word.length >= 5 && withinEdits(word, token, 1)),
  );
  if (wordMatch) return 1;
  // Only longer words count inside other words: "phone" in "smartphone" is
  // meaningful, "work" in "kettleworks" is not.
  return token.length >= 5 && field.compact.includes(token) ? SUBSTRING_MATCH : 0;
}

/**
 * Products that best match the query, best first. Every word of the query
 * counts; products matching the most query words come first, ranked by where
 * the words matched (a title match beats a description match).
 */
export function rankProducts(products: Product[], categories: Category[], query: string): Product[] {
  const all = words(query);
  const meaningful = all.filter((word) => !STOPWORDS.has(word));
  const tokens = meaningful.length ? meaningful : all;
  if (tokens.length === 0) return [];

  // Adjacent words joined ("smart" + "watch" → "smartwatch") count as an alternative spelling.
  const joined = tokens.slice(1).map((token, i) => tokens[i] + token);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  // A category word ("books", "electronics", "kitchen") means *that aisle*:
  // results stay inside it, so "books" never returns a laptop called "Book".
  // Synonyms count too, so "novel" (→ book) also means the Books aisle.
  const intentWords = new Set(tokens.flatMap((token) => [token, ...(SYNONYMS[token] ?? [])]));
  const namedCategories = new Set(
    categories.filter((c) => words(c.name).some((word) => intentWords.has(word))).map((c) => c.id),
  );
  if (namedCategories.size === 0) return rankWithin(products, tokens, joined, categoryName).results;

  // …unless the whole store matches more of the query ("lumen book" means
  // the Lumen Book laptop, not the Books aisle).
  const inAisle = rankWithin(
    products.filter((p) => namedCategories.has(p.categoryId)),
    tokens,
    joined,
    categoryName,
  );
  const everywhere = rankWithin(products, tokens, joined, categoryName);
  return everywhere.matched > inAisle.matched ? everywhere.results : inAisle.results;
}

function rankWithin(
  pool: Product[],
  tokens: string[],
  joined: string[],
  categoryName: Map<string, string>,
): { results: Product[]; matched: number } {
  const indexed = pool.map((product) => ({
    product,
    fields: {
      title: indexField(product.title),
      brand: indexField(product.brand),
      category: indexField(categoryName.get(product.categoryId) ?? ""),
      versions: indexField((product.variants ?? []).map((v) => v.label).join(" ")),
      features: indexField(product.bullets.join(" ")),
      description: indexField(product.description),
    } satisfies Record<Field, IndexedField>,
  }));
  // A word is only treated as a possible typo when it matches nothing as
  // typed — "speaker" is a real word here, so it must not also find "sneaker".
  const typoAllowed = new Set(
    tokens.filter(
      (token) =>
        !indexed.some(({ fields }) =>
          (Object.keys(fields) as Field[]).some((f) => fieldMatch(fields[f], token, false) > 0),
        ),
    ),
  );

  const scored = indexed.map(({ product, fields }) => {
    // A word's weight is summed over every field it appears in — a real book
    // (category + features) outranks a laptop that merely says "Book" once —
    // and a synonym counts as the word itself.
    // Typo tolerance applies only to what the shopper typed, never to a
    // synonym — otherwise "shoes" → "sneaker" → (one letter off) "speaker".
    const weightFor = (term: string, allowTypo: boolean, only: readonly Field[] = ALL_FIELDS) =>
      only.reduce((sum, f) => sum + fieldMatch(fields[f], term, allowTypo) * FIELD_WEIGHTS[f], 0);
    const best = (token: string, only: readonly Field[] = ALL_FIELDS) =>
      Math.max(
        weightFor(token, typoAllowed.has(token), only),
        ...(SYNONYMS[token] ?? []).map((synonym) => weightFor(synonym, false, only)),
      );
    // Does the product *name itself* as what was asked for (title, brand,
    // category, versions) — or only mention it in passing in its copy?
    const namesIt = [...tokens, ...joined].some((term) => best(term, IDENTITY_FIELDS) > 0);

    let matched = 0;
    let score = 0;
    for (const token of tokens) {
      const weight = best(token);
      if (weight > 0) {
        matched++;
        score += weight;
      }
    }
    // A joined-pair match stands in for both halves ("smartwatch" for "smart watch").
    joined.forEach((pair, i) => {
      const weight = best(pair);
      if (weight > 0) {
        const halves = [tokens[i], tokens[i + 1]].filter((t) => best(t) === 0).length;
        matched += halves;
        score += weight;
      }
    });
    return { product, matched, score, namesIt };
  });

  const topMatched = Math.max(0, ...scored.map((s) => s.matched));
  if (topMatched === 0) return { results: [], matched: 0 };
  // Keep only products that cover as many query words as the best one does
  // (so "wireless headphones" doesn't return every other wireless thing),
  // and drop weak incidental hits that score far below the best match (a
  // passing mention in a feature list shouldn't sit next to the real thing).
  let tier = scored.filter((s) => s.matched === topMatched);
  // If some products are the thing asked for, drop ones that only mention it
  // in their description or features — "laptop" shouldn't return a backpack
  // just because it has a "padded laptop sleeve".
  if (tier.some((s) => s.namesIt)) tier = tier.filter((s) => s.namesIt);
  const topScore = Math.max(...tier.map((s) => s.score));
  const results = tier
    .filter((s) => s.score >= topScore * MIN_RELATIVE_SCORE)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product);
  return { results, matched: topMatched };
}
