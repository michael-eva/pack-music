/** Split a stored body field into paragraphs for rendering. */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Human date label, e.g. "3 May 2026". */
export function dateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export type PostRecord = {
  slug: string;
  title: string;
  published_on: string;
  author: string;
  excerpt: string;
  body: string;
  cover_image?: string | null;
};

export type LibraryRecord = {
  id: string;
  kind: "paper" | "policy" | "faq";
  title: string;
  label: string;
  body: string;
  href: string | null;
  sort_order: number;
};

export type BoardRecord = {
  id: string;
  name: string;
  role: string;
  blurb: string;
  bio: string;
  photo_url: string | null;
  photo_position: string | null;
};
