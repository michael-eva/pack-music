/**
 * Light checks on a submitted release (ING-4 to ING-6, section 4 error table).
 *
 * Pure: no I/O. Each issue has a code, an outcome, a plain message an artist
 * can act on, and who fixes it. Reject means nothing goes live until it is
 * fixed; Hold means a person at The Pack decides; Warn never blocks.
 */

export type Outcome = "reject" | "hold" | "warn";
export type FixedBy = "you" | "The Pack";

export type Issue = {
  code: string;
  outcome: Outcome;
  message: string;
  fixedBy: FixedBy;
  trackId?: string;
};

export type CheckTrack = {
  id: string;
  position: number;
  title: string;
  isrc: string | null;
  explicit: boolean | null;
  audioPath: string | null;
  aiDeclaration: string | null;
  genreId: string | null;
  lufs: number | null;
  splits: { shareBp: number }[];
};

export type CheckRelease = {
  title: string;
  upc: string | null;
  tracks: CheckTrack[];
};

export type CheckContext = {
  acceptedAiAnswers: string[];
  genreIds: Set<string>;
  /** Identifiers already used by other releases in the catalogue. */
  existingIsrcs: Set<string>;
  existingUpcs: Set<string>;
};

export function normaliseIsrc(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/** ISRC: CC-XXX-YY-NNNNN, twelve characters once the dashes are removed. */
export function isValidIsrc(value: string) {
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(normaliseIsrc(value));
}

/** UPC-A (12) or EAN-13 (13) digits with a valid check digit. */
export function isValidUpc(value: string) {
  const digits = value.replace(/\s/g, "");
  if (!/^\d{12,13}$/.test(digits)) return false;
  const body = digits.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10 === Number(digits[digits.length - 1]);
}

function percent(bp: number) {
  const value = bp / 100;
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(2)}%`;
}

export function checkRelease(release: CheckRelease, context: CheckContext): Issue[] {
  const issues: Issue[] = [];
  const add = (issue: Issue) => issues.push(issue);

  if (!release.title.trim()) {
    add({
      code: "E120",
      outcome: "reject",
      fixedBy: "you",
      message: "This release needs a title. Add one and send it again.",
    });
  }

  if (!release.upc?.trim()) {
    add({
      code: "E130",
      outcome: "reject",
      fixedBy: "you",
      message:
        "This release needs its UPC barcode number. You'll find it with your distributor or on the original release.",
    });
  } else if (!isValidUpc(release.upc)) {
    add({
      code: "E131",
      outcome: "reject",
      fixedBy: "you",
      message: `The UPC "${release.upc}" doesn't look right. It should be 12 or 13 digits. Check it against your original release and try again.`,
    });
  } else if (context.existingUpcs.has(release.upc.replace(/\s/g, ""))) {
    add({
      code: "E521",
      outcome: "hold",
      fixedBy: "The Pack",
      message:
        "This UPC is already in The Pack catalogue on another release. A person will check whether this is a re-release or a mix-up, usually within two working days.",
    });
  }

  if (release.tracks.length === 0) {
    add({
      code: "E202",
      outcome: "reject",
      fixedBy: "you",
      message: "This release has no songs yet. Add at least one song and send it again.",
    });
  }

  const seenIsrcs = new Map<string, number>();
  for (const track of [...release.tracks].sort((a, b) => a.position - b.position)) {
    const name = track.title.trim()
      ? `Track ${track.position}, “${track.title.trim()}”`
      : `Track ${track.position}`;
    const t = { trackId: track.id };

    if (!track.title.trim()) {
      add({
        ...t,
        code: "E201",
        outcome: "reject",
        fixedBy: "you",
        message: `${name} needs a title.`,
      });
    }
    if (!track.audioPath) {
      add({
        ...t,
        code: "E204",
        outcome: "reject",
        fixedBy: "you",
        message: `${track.title.trim() ? name + "," : name} is missing its audio file. Add the file to the song and send the release again.`,
      });
    }

    if (!track.isrc?.trim()) {
      add({
        ...t,
        code: "E210",
        outcome: "reject",
        fixedBy: "you",
        message: `${name} needs its ISRC. Re-released songs already have one: check with your distributor.`,
      });
    } else if (!isValidIsrc(track.isrc)) {
      add({
        ...t,
        code: "E211",
        outcome: "reject",
        fixedBy: "you",
        message: `The ISRC for ${name} doesn't look right. It should be 12 letters and numbers, like AU-XX0-26-00001.`,
      });
    } else {
      const isrc = normaliseIsrc(track.isrc);
      const earlier = seenIsrcs.get(isrc);
      if (earlier !== undefined) {
        add({
          ...t,
          code: "E212",
          outcome: "reject",
          fixedBy: "you",
          message: `${name} has the same ISRC as track ${earlier}. Each song needs its own.`,
        });
      } else if (context.existingIsrcs.has(isrc)) {
        add({
          ...t,
          code: "E520",
          outcome: "hold",
          fixedBy: "The Pack",
          message: `The ISRC for ${name.charAt(0).toLowerCase()}${name.slice(1)} is already in The Pack catalogue on another release. A person will check whether this is a re-release or a mix-up, usually within two working days.`,
        });
      }
      seenIsrcs.set(isrc, track.position);
    }

    if (track.explicit === null) {
      add({
        ...t,
        code: "E215",
        outcome: "reject",
        fixedBy: "you",
        message: `Tell us whether ${name} has explicit lyrics, yes or no.`,
      });
    }

    if (!track.aiDeclaration) {
      add({
        ...t,
        code: "E310",
        outcome: "reject",
        fixedBy: "you",
        message: `The AI question for ${name} hasn't been answered. Answer it and send the release again.`,
      });
    } else if (!context.acceptedAiAnswers.includes(track.aiDeclaration)) {
      add({
        ...t,
        code: "E311",
        outcome: "hold",
        fixedBy: "The Pack",
        message: `You answered ${capitalise(track.aiDeclaration)} to the AI question for ${name}. A person at The Pack will read your answer and get back to you. You don't need to do anything yet.`,
      });
    }

    const total = track.splits.reduce((a, s) => a + s.shareBp, 0);
    if (track.splits.length === 0) {
      add({
        ...t,
        code: "E401",
        outcome: "reject",
        fixedBy: "you",
        message: `${name} doesn't say who gets paid. Add at least one person and their share.`,
      });
    } else if (total !== 10000) {
      add({
        ...t,
        code: "E402",
        outcome: "reject",
        fixedBy: "you",
        message: `The splits for ${track.title.trim() ? `“${track.title.trim()}”` : name} add up to ${percent(total)}. They need to total 100%. Fix the splits and send the release again.`,
      });
    }

    if (!track.genreId) {
      add({
        ...t,
        code: "E600",
        outcome: "reject",
        fixedBy: "you",
        message: `Choose a genre for ${name} from The Pack list.`,
      });
    } else if (!context.genreIds.has(track.genreId)) {
      add({
        ...t,
        code: "E601",
        outcome: "hold",
        fixedBy: "The Pack",
        message: `The genre for ${name} isn't on The Pack list yet. Choose the closest one, or tell us what's missing so we can consider adding it.`,
      });
    }

    if (track.audioPath && track.lufs === null) {
      add({
        ...t,
        code: "E701",
        outcome: "hold",
        fixedBy: "The Pack",
        message: `We couldn't measure the loudness of ${name} yet. A person at The Pack will check it. You don't need to do anything.`,
      });
    }
  }

  return issues;
}

/** Next state after checks: any reject needs the artist; any hold needs a person. */
export function stateAfterChecks(issues: Issue[]): "needs_attention" | "held" | "in_review" {
  if (issues.some((i) => i.outcome === "reject")) return "needs_attention";
  if (issues.some((i) => i.outcome === "hold")) return "held";
  return "in_review";
}

function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
