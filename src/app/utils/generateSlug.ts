import slugify from "slugify";

export const generateSlug = (input: string): string => {
  const baseSlug = slugify(input, {
    lower: true,
    strict: true,
    replacement: "-",
  });

  return `${baseSlug}`;
};

export const productSlug = (name: string, sku: string) => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return `${slug}-${sku}`;
};

export const generateSKU = (productName: string) => {
  if (!productName) throw new Error("Product name is required");

  const normalized = productName
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .toUpperCase();

  const initials = normalized
    .split(" ")
    .slice(0, 3)
    .map((word: string) => word[0])
    .join("");

  const randomId = Math.floor(1000 + Math.random() * 9000);

  return `${initials}-${randomId}`;
};
