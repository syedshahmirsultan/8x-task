import { z } from "zod";

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");

/** Either an image uploaded through the admin panel or an external https URL. */
const imageUrl = z
  .string()
  .trim()
  .refine(
    (value) => /^\/api\/images\/[0-9a-f-]{36}$/.test(value) || /^https:\/\/[^\s]+$/.test(value),
    "Must be an uploaded image or an https:// URL.",
  );

const cents = z.number().int().min(0);

export const productInputSchema = z.object({
  title: z.string().trim().min(1),
  slug,
  brand: z.string().trim().min(1),
  categoryId: z.string().min(1),
  price: cents,
  compareAtPrice: cents.nullable(),
  stock: z.number().int().min(0),
  images: z.array(imageUrl).min(1, "Add at least one image."),
  description: z.string().trim().min(1),
  bullets: z.array(z.string().trim().min(1)),
  variants: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().trim().min(1),
      price: cents,
      stock: z.number().int().min(0),
      image: imageUrl.nullable(),
    }),
  ),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1),
  slug,
  image: imageUrl,
});

/** First validation message, for a toast. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? `${issue.path.join(".") || "input"}: ${issue.message}` : "Invalid input.";
}
