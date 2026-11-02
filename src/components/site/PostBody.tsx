import type { ReactNode } from "react";
import { paragraphs } from "@/lib/content-format";

/** Renders a stored post body: paragraphs, bold headings, quotes and lists. */
export function PostBody({ body }: { body: string }) {
  const blocks = paragraphs(body);

  return (
    <div className="space-y-6 text-[1.05rem] leading-[1.75] text-ink sm:text-lg">
      {blocks.map((block, i) => {
        const key = `${i}-${block.slice(0, 24)}`;
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

        if (lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l))) {
          return (
            <ul key={key} className="list-disc space-y-2 pl-6">
              {lines.map((l) => (
                <li key={l.slice(0, 24)}>{rich(l.replace(/^[-*•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        if (lines.length > 0 && lines.every((l) => /^\d+[.)]\s+/.test(l))) {
          return (
            <ol key={key} className="list-decimal space-y-2 pl-6">
              {lines.map((l) => (
                <li key={l.slice(0, 24)}>{rich(l.replace(/^\d+[.)]\s+/, ""))}</li>
              ))}
            </ol>
          );
        }

        if (lines.length > 0 && lines.every((l) => l.startsWith(">"))) {
          return (
            <blockquote
              key={key}
              className="border-l-4 border-ink/30 pl-5 text-[1.05rem] italic leading-[1.7]"
            >
              {rich(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}
            </blockquote>
          );
        }

        const heading = block.match(/^(#{2,4})\s+(.*)$/);
        if (heading) {
          const level = (heading[1] ?? "").length;
          const size = level === 2 ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl";
          return (
            <h2 key={key} className={`pt-2 font-bold uppercase leading-tight ${size}`}>
              {stripMarks(heading[2] ?? "")}
            </h2>
          );
        }

        // A short standalone line with no closing punctuation reads as a heading too.
        const single = lines.length === 1 ? (lines[0] ?? "") : "";
        const bolded = single.match(/^\*\*(.+)\*\*[:.]?$/);
        if (bolded || (single && single.length < 90 && !/[.?!,;:]$/.test(single) && blocks.length > 2)) {
          return (
            <h2 key={key} className="pt-2 text-xl font-bold leading-tight sm:text-2xl">
              {stripMarks(bolded ? (bolded[1] ?? "") : single)}
            </h2>
          );
        }

        return <p key={key}>{rich(block.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}

/** Inline **bold** support. */
function rich(text: string): ReactNode {
  const cleaned = text.replace(/^#+\s*/, "");
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${i}-${part}`} className="font-bold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${i}-${part.slice(0, 12)}`}>{part}</span>
    ),
  );
}

function stripMarks(text: string) {
  return text.replace(/\*\*/g, "").replace(/^#+\s*/, "");
}
