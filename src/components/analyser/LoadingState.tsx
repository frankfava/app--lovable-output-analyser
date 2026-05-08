import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export const STEPS = [
  "Fetching repo metadata",
  "Reading source files",
  "Analysing with AI",
  "Building scorecard",
];

export function LoadingState({
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
