import { Card } from "@/components/ui/card";

const ITEMS = [
  { name: "Component Structure", desc: "Composition, separation, single-responsibility." },
  { name: "Type Safety", desc: "Meaningful TS, no unchecked any." },
  { name: "Security Patterns", desc: "Secrets, auth, input handling." },
  { name: "Dependency Hygiene", desc: "Reasonable deps, no bloat." },
  { name: "Maintainability", desc: "Could a mid-level dev extend it?" },
];

export function DimensionsGrid() {
  return (
    <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-left">
      {ITEMS.map((d, i) => (
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
