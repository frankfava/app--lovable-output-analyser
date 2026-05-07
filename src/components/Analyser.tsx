import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowRight,
  Github,
  Loader2,
  Sparkles,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Scorecard, type ScorecardData } from "./Scorecard";

const SELF_REPO = "github.com/frankfava/app--lovable-output-analyser";

const STEPS = [
  "Fetching repo metadata",
  "Reading source files",
  "Analysing with AI",
  "Building scorecard",
];

export function Analyser() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<ScorecardData | null>(null);

  async function runAnalysis(url: string) {
    setResult(null);
    setLoading(true);
    setStepIdx(0);

    // Step ticker — visual only
    const ticker = setInterval(() => {
      setStepIdx((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 1800);

    try {
      const { data, error } = await supabase.functions.invoke("analyse-repo", {
        body: { repoUrl: url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as ScorecardData);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Analysis failed.";
      toast.error(message);
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setRepoUrl("");
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <Header />

      <main className="mx-auto max-w-5xl px-6 pb-24">
        {!result && !loading && (
          <Hero
            repoUrl={repoUrl}
            setRepoUrl={setRepoUrl}
            onAnalyse={() => repoUrl.trim() && runAnalysis(repoUrl)}
            onSelf={() => {
              setRepoUrl(SELF_REPO);
              runAnalysis(SELF_REPO);
            }}
          />
        )}

        {loading && <LoadingState stepIdx={stepIdx} repoUrl={repoUrl} />}

        {result && !loading && (
          <ResultView data={result} onReset={reset} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold tracking-tight">Output Analyser</span>
      </div>
      <a
        href="https://github.com/frankfava/app--lovable-output-analyser"
        target="_blank"
        rel="noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <Github className="h-4 w-4" /> Source
      </a>
    </header>
  );
}

function Hero({
  repoUrl,
  setRepoUrl,
  onAnalyse,
  onSelf,
}: {
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  onAnalyse: () => void;
  onSelf: () => void;
}) {
  return (
    <section className="pt-12 pb-16 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs text-muted-foreground mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-score-good" />
        Score Lovable-generated codebases
      </div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
        Can your team maintain
        <br />
        <span className="text-primary">this AI-generated repo?</span>
      </h1>
      <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
        Paste a public GitHub URL. Get a 5-dimension enterprise-readiness scorecard
        in under a minute.
      </p>

      <Card className="mt-10 p-2 max-w-2xl mx-auto flex items-center gap-2 shadow-sm">
        <div className="pl-3 text-muted-foreground">
          <Github className="h-5 w-5" />
        </div>
        <Input
          placeholder="github.com/user/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAnalyse()}
          className="border-0 shadow-none focus-visible:ring-0 text-base h-11"
        />
        <Button
          onClick={onAnalyse}
          disabled={!repoUrl.trim()}
          className="h-11 px-5"
        >
          Analyse <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </Card>

      <button
        onClick={onSelf}
        className="mt-4 text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline inline-flex items-center gap-1.5"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Or analyse this tool's own code
      </button>

      <DimensionsGrid />
    </section>
  );
}

function DimensionsGrid() {
  const items = [
    { name: "Component Structure", desc: "Composition, separation, single-responsibility." },
    { name: "Type Safety", desc: "Meaningful TS, no unchecked any." },
    { name: "Security Patterns", desc: "Secrets, auth, input handling." },
    { name: "Dependency Hygiene", desc: "Reasonable deps, no bloat." },
    { name: "Maintainability", desc: "Could a mid-level dev extend it?" },
  ];
  return (
    <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-left">
      {items.map((d, i) => (
        <Card key={d.name} className="p-4 bg-surface/50">
          <div className="text-xs font-mono text-muted-foreground mb-1">
            0{i + 1}
          </div>
          <div className="font-medium text-sm">{d.name}</div>
          <div className="text-xs text-muted-foreground mt-1">{d.desc}</div>
        </Card>
      ))}
    </div>
  );
}

function LoadingState({
  stepIdx,
  repoUrl,
}: {
  stepIdx: number;
  repoUrl: string;
}) {
  return (
    <section className="pt-24 pb-16 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="text-sm text-muted-foreground font-mono">{repoUrl}</div>
      </div>
      <Card className="p-6">
        <ul className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              <div
                className={`h-2 w-2 rounded-full ${
                  i < stepIdx
                    ? "bg-score-good"
                    : i === stepIdx
                      ? "bg-primary animate-pulse"
                      : "bg-border"
                }`}
              />
              <span
                className={
                  i <= stepIdx ? "text-foreground" : "text-muted-foreground"
                }
              >
                {s}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function ResultView({
  data,
  onReset,
}: {
  data: ScorecardData;
  onReset: () => void;
}) {
  return (
    <section className="pt-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Github className="h-4 w-4 text-muted-foreground" />
          <a
            href={data.repo.url}
            target="_blank"
            rel="noreferrer"
            className="font-mono hover:text-primary inline-flex items-center gap-1"
          >
            {data.repo.owner}/{data.repo.repo}
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-muted-foreground">
            · {data.files_analysed.length} files analysed
          </span>
        </div>
        <Button variant="outline" onClick={onReset} size="sm">
          <RotateCcw className="h-4 w-4 mr-1.5" /> Analyse another
        </Button>
      </div>
      <Scorecard data={data} />
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
        <span>Built with Lovable. Public repos only.</span>
        <span>Powered by AI · No data retained.</span>
      </div>
    </footer>
  );
}
