import { ZodError } from "zod";

export const handleZodError = (error: ZodError) => {
  const issues = error.issues;

  if (issues.length === 0) return "";

  return issues.map((issue) => issue.message).join(" ");
};
