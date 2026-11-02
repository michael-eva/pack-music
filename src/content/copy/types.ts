/** A single editable text block on the public site. */
export type CopyField = {
  key: string;
  label: string;
  /** Long text gets a textarea in the admin. */
  multiline?: boolean;
};

/** All editable text blocks for one page, in the order they appear on the page. */
export type CopyGroup = {
  id: string;
  /** Page name shown in the admin. */
  label: string;
  /** Route path, so admins can preview what they're editing. */
  path: string;
  fields: CopyField[];
  /** The copy shipped with the site, used until an admin overrides it. */
  text: Record<string, string>;
};

/** Helper: hero fields shared by every page that uses the standard page header. */
export function heroFields(prefix: string): CopyField[] {
  return [
    { key: `${prefix}.eyebrow`, label: "Small label above the headline" },
    { key: `${prefix}.title`, label: "Headline", multiline: true },
    { key: `${prefix}.lead`, label: "Intro paragraph", multiline: true },
  ];
}

/** Helper: the three fields of a flyer card. */
export function cardFields(prefix: string, name: string): CopyField[] {
  return [
    { key: `${prefix}.kicker`, label: `${name} – label` },
    { key: `${prefix}.title`, label: `${name} – heading`, multiline: true },
    { key: `${prefix}.body`, label: `${name} – text`, multiline: true },
  ];
}
