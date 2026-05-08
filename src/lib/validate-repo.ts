import { z } from "zod";

// Accepts: https://github.com/owner/repo, github.com/owner/repo, owner/repo
const repoSchema = z
  .string()
  .trim()
  .min(3, "Enter a GitHub repo URL")
  .max(200, "URL is too long")
  .regex(
    /^(https?:\/\/)?(www\.)?github\.com\/[\w.-]{1,39}\/[\w.-]{1,100}\/?$|^[\w.-]{1,39}\/[\w.-]{1,100}$/,
    "Use github.com/owner/repo or owner/repo",
  );

export function validateRepoUrl(input: string):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  const result = repoSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid URL" };
  }
  return { ok: true, value: result.data };
}
