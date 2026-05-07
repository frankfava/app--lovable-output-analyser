// Lovable Output Analyser — fetches a public GitHub repo and scores it
// across 5 enterprise-readiness dimensions using the Lovable AI Gateway.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INCLUDE_EXT = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"];
const INCLUDE_NAMES = [
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "vite.config.js",
  "tailwind.config.ts",
  "tailwind.config.js",
  ".env.example",
  "readme.md",
];
const EXCLUDE_DIRS = [
  "node_modules",
  "dist",
  "build",
  ".git",
  ".next",
  "coverage",
  ".turbo",
];
const MAX_FILES = 50;
const MAX_TOTAL_CHARS = 100_000;
const MAX_FILE_CHARS = 8_000;

type GhTreeItem = { path: string; type: string; size?: number };

function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  let s = input.trim().replace(/\.git$/, "").replace(/\/$/, "");
  s = s.replace(/^https?:\/\//, "").replace(/^github\.com\//, "");
  const parts = s.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { owner: parts[0], repo: parts[1] };
}

function shouldInclude(path: string): boolean {
  const lower = path.toLowerCase();
  if (EXCLUDE_DIRS.some((d) => lower.startsWith(`${d}/`) || lower.includes(`/${d}/`))) {
    return false;
  }
  const base = lower.split("/").pop() || lower;
  if (INCLUDE_NAMES.includes(base)) return true;
  if (lower.includes(".test.") || lower.includes(".spec.")) return false;
  return INCLUDE_EXT.some((ext) => lower.endsWith(ext));
}

function priority(path: string): number {
  const p = path.toLowerCase();
  const base = p.split("/").pop() || p;
  if (base === "package.json") return 0;
  if (base === "tsconfig.json") return 1;
  if (base.startsWith("vite.config")) return 2;
  if (p.startsWith("src/")) return 3;
  if (base === "readme.md") return 4;
  return 5;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repoUrl } = await req.json();
    const parsed = parseRepoUrl(repoUrl ?? "");
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Invalid GitHub repo URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { owner, repo } = parsed;
    const ghHeaders: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "lovable-output-analyser",
    };

    // 1. Find default branch
    const repoResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: ghHeaders },
    );
    if (repoResp.status === 404) {
      return new Response(
        JSON.stringify({
          error: "Repository not found. Make sure it's public and the URL is correct.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (repoResp.status === 403) {
      return new Response(
        JSON.stringify({
          error: "GitHub API rate limit hit. Please try again in a few minutes.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!repoResp.ok) {
      return new Response(
        JSON.stringify({ error: `GitHub error: ${repoResp.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const repoData = await repoResp.json();
    const branch: string = repoData.default_branch ?? "main";

    // 2. Recursive tree
    const treeResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers: ghHeaders },
    );
    if (!treeResp.ok) {
      return new Response(
        JSON.stringify({ error: "Could not fetch repo tree." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const tree = await treeResp.json();
    const items: GhTreeItem[] = (tree.tree ?? []).filter(
      (t: GhTreeItem) => t.type === "blob",
    );

    const candidates = items
      .filter((i) => shouldInclude(i.path))
      .sort((a, b) => priority(a.path) - priority(b.path));

    // 3. Fetch file contents (raw)
    const files: { path: string; content: string }[] = [];
    let totalChars = 0;
    for (const item of candidates) {
      if (files.length >= MAX_FILES) break;
      if (totalChars >= MAX_TOTAL_CHARS) break;
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;
      try {
        const r = await fetch(rawUrl);
        if (!r.ok) continue;
        let content = await r.text();
        if (content.length > MAX_FILE_CHARS) {
          content = content.slice(0, MAX_FILE_CHARS) + "\n/* ...truncated... */";
        }
        if (totalChars + content.length > MAX_TOTAL_CHARS) {
          content = content.slice(0, MAX_TOTAL_CHARS - totalChars);
        }
        files.push({ path: item.path, content });
        totalChars += content.length;
      } catch (_) {
        // skip
      }
    }

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No analysable files found in this repo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Build prompt and call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `You are a senior software engineer reviewing a React codebase generated by Lovable (an AI app builder). Your job is to evaluate whether an engineering team could take ownership of this code and maintain it in production.

Analyse the provided files and score the codebase across exactly five dimensions:
1. Component Structure — small, single-responsibility components, sensible folder organisation, composition vs prop drilling.
2. Type Safety — meaningful TypeScript, typed props/responses, absence of any/@ts-ignore.
3. Security Patterns — no exposed secrets in client code, proper auth handling, input validation, env var usage.
4. Dependency Hygiene — reasonable dep count, no deprecated/duplicate packages, signs of bundle bloat.
5. Maintainability — could a mid-level React dev pick this up? Naming, readability, separation of concerns.

For each dimension provide a 1–5 score, a 2–3 sentence explanation, and 1–3 specific file references. Also provide an overall score (weighted average, 1–5) and a 2–3 sentence summary.`;

    const userContent = files
      .map((f) => `--- FILE: ${f.path} ---\n${f.content}`)
      .join("\n\n");

    const tool = {
      type: "function",
      function: {
        name: "submit_scorecard",
        description: "Submit the codebase scorecard.",
        parameters: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            overall_summary: { type: "string" },
            dimensions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    enum: [
                      "Component Structure",
                      "Type Safety",
                      "Security Patterns",
                      "Dependency Hygiene",
                      "Maintainability",
                    ],
                  },
                  score: { type: "number" },
                  explanation: { type: "string" },
                  file_references: { type: "array", items: { type: "string" } },
                },
                required: ["name", "score", "explanation", "file_references"],
                additionalProperties: false,
              },
            },
          },
          required: ["overall_score", "overall_summary", "dimensions"],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Repository: ${owner}/${repo}\nFiles analysed: ${files.length}\n\n${userContent}`,
            },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "submit_scorecard" } },
        }),
      },
    );

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit reached. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({
          error: "AI credits exhausted. Add credits in Workspace → Usage.",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(
        JSON.stringify({ error: "AI analysis failed." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "AI response was not structured as expected." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const scorecard = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        repo: { owner, repo, branch, url: `https://github.com/${owner}/${repo}` },
        files_analysed: files.map((f) => f.path),
        scorecard,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyse-repo error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
