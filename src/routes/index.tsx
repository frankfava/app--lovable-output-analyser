import { createFileRoute } from "@tanstack/react-router";
import { Analyser } from "@/components/Analyser";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lovable Output Analyser — Score AI-generated codebases" },
      {
        name: "description",
        content:
          "Score any public GitHub repo across 5 enterprise-readiness dimensions: structure, types, security, dependencies, maintainability.",
      },
      { property: "og:title", content: "Lovable Output Analyser" },
      {
        property: "og:description",
        content:
          "Score any public GitHub repo across 5 enterprise-readiness dimensions.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <Analyser />;
}
