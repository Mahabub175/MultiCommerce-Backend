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
