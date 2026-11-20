import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/artist-portal/agreement-full")({
  head: () => ({ meta: [
    { title: "Full Artist Agreement — The Pack" },
    { name: "description", content: "Draft full Artist Agreement for The Pack." },
    { property: "og:title", content: "Full Artist Agreement — The Pack" },
    { property: "og:description", content: "Draft full Artist Agreement for The Pack." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "Full Artist Agreement — The Pack" },
    { name: "twitter:description", content: "Draft full Artist Agreement for The Pack." },
  ] }),
  component: FullAgreement,
});

function FullAgreement() {
  return <main className="pk min-h-screen grad-pp p-4 md:p-8"><article className="pk-card max-w-3xl mx-auto">
    <a href="/artist-portal/agreement" className="underline">Back to Artist Agreement</a>
    <h1 className="pk-h1 mt-5">Full Artist Agreement</h1><p className="font-bold mt-3">Draft</p>
    {["Parties and definitions", "Permission to stream recordings", "Licence-back", "Revenue and artist payments", "Release withdrawal", "Data and privacy", "Term and termination", "Disputes and governing law"].map((heading, index) => <section key={heading} className="mt-6"><h2 className="pk-h3">{index + 1}. {heading}</h2><p className="mt-2">Draft — placeholder clause pending legal review.</p></section>)}
  </article></main>;
}
