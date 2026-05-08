import { ArrowRight, Github, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DimensionsGrid } from "./DimensionsGrid";

export function Hero({
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
