import { Github, Sparkles } from "lucide-react";

export function Header() {
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
