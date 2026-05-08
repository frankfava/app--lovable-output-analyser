import { ExternalLink, Github, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scorecard, type ScorecardData } from "../Scorecard";

export function ResultView({
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
