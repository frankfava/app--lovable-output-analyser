import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

export type Dimension = {
  name: string;
  score: number;
  explanation: string;
  file_references: string[];
};

export type ScorecardData = {
  repo: { owner: string; repo: string; branch: string; url: string };
  files_analysed: string[];
  scorecard: {
    overall_score: number;
    overall_summary: string;
    dimensions: Dimension[];
  };
};

function tone(score: number): "good" | "mid" | "bad" {
  if (score >= 4) return "good";
  if (score >= 3) return "mid";
  return "bad";
}

function gradeLetter(score: number): string {
  if (score >= 4.5) return "A";
  if (score >= 3.5) return "B";
  if (score >= 2.5) return "C";
  if (score >= 1.5) return "D";
  return "F";
}

const TONE_CLASSES: Record<"good" | "mid" | "bad", string> = {
  good: "bg-score-good/15 text-score-good-foreground border-score-good/30",
  mid: "bg-score-mid/20 text-score-mid-foreground border-score-mid/40",
  bad: "bg-score-bad/15 text-score-bad-foreground border-score-bad/30",
};

const TONE_BAR: Record<"good" | "mid" | "bad", string> = {
  good: "bg-score-good",
  mid: "bg-score-mid",
  bad: "bg-score-bad",
};

export function Scorecard({ data }: { data: ScorecardData }) {
  const { overall_score, overall_summary, dimensions } = data.scorecard;
  const t = tone(overall_score);

  return (
    <div className="space-y-4">
      <Card className="p-8 overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div
            className={`shrink-0 h-28 w-28 rounded-2xl border flex flex-col items-center justify-center ${TONE_CLASSES[t]}`}
          >
            <div className="text-4xl font-semibold leading-none font-mono">
              {gradeLetter(overall_score)}
            </div>
            <div className="text-xs mt-1 opacity-70">
              {overall_score.toFixed(1)} / 5
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Overall assessment
            </div>
            <p className="text-base sm:text-lg leading-relaxed text-foreground">
              {overall_summary}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        {dimensions.map((d, i) => (
          <DimensionRow key={d.name} dim={d} index={i + 1} />
        ))}
      </div>
    </div>
  );
}

function DimensionRow({ dim, index }: { dim: Dimension; index: number }) {
  const [open, setOpen] = useState(false);
  const t = tone(dim.score);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-5 flex items-center gap-4 hover:bg-surface transition-colors"
      >
        <div className="text-xs font-mono text-muted-foreground w-6">
          0{index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground">{dim.name}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden max-w-[200px]">
              <div
                className={`h-full ${TONE_BAR[t]}`}
                style={{ width: `${(dim.score / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {dim.score}/5
            </span>
          </div>
        </div>
        <div
          className={`shrink-0 h-10 w-10 rounded-lg border flex items-center justify-center font-semibold font-mono ${TONE_CLASSES[t]}`}
        >
          {dim.score}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t bg-surface/40">
          <div className="space-y-3 mt-3">
            {dim.explanation.split(/\n\n+/).map((para, i) => (
              <p key={i} className="text-sm text-foreground/80 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
          {dim.file_references.length > 0 && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Evidence
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {dim.file_references.map((f) => (
                  <li
                    key={f}
                    className="text-xs font-mono px-2 py-1 rounded-md bg-background border text-foreground/80"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
