import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import type { ScorecardData } from "./Scorecard";
import { Header } from "./analyser/Header";
import { Footer } from "./analyser/Footer";
import { Hero } from "./analyser/Hero";
import { LoadingState, STEPS } from "./analyser/LoadingState";
import { ResultView } from "./analyser/ResultView";
import { validateRepoUrl } from "@/lib/validate-repo";

const SELF_REPO = "github.com/frankfava/app--lovable-output-analyser";

export function Analyser() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<ScorecardData | null>(null);

  async function runAnalysis(url: string) {
    const validation = validateRepoUrl(url);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    setResult(null);
    setLoading(true);
    setStepIdx(0);

    const ticker = setInterval(() => {
      setStepIdx((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 1800);

    try {
      const { data, error } = await supabase.functions.invoke("analyse-repo", {
        body: { repoUrl: validation.value },
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

        {result && !loading && <ResultView data={result} onReset={reset} />}
      </main>

      <Footer />
    </div>
  );
}
