/**
 * Playlist rules, checked while the curator works (CUR-2, CUR-7).
 * Pure: no I/O, shared by the builder screen and the publish function.
 * A playlist loops, so the last track is followed by the first.
 */

export type RuleTrack = {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  durationMs: number;
  explicit: boolean;
};

export type PlaylistRules = { noArtistTwiceInARow: boolean; repeatWindowMinutes: number };

export type RuleIssue = {
  kind: "artist_twice" | "repeat_window" | "loop_short" | "explicit";
  severity: "break" | "warning";
  positions: number[]; // 0-based positions of the tracks involved
  message: string;
};

export function checkPlaylist(
  tracks: RuleTrack[],
  rules: PlaylistRules,
  opts: { explicitAllowed?: boolean } = {},
): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const n = tracks.length;
  if (n === 0) return issues;

  if (rules.noArtistTwiceInARow && n > 1) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (j === 0 && n === 2) continue; // a two-track loop is already checked by i=0
      const a = tracks[i]!;
      const b = tracks[j]!;
      if (a.artistId === b.artistId) {
        issues.push({
          kind: "artist_twice",
          severity: "break",
          positions: [i, j],
          message: `${a.artistName} plays twice in a row: “${a.title}” then “${b.title}”${j === 0 ? " (when the list loops)" : ""}.`,
        });
      }
    }
  }

  const windowMs = rules.repeatWindowMinutes * 60_000;
  if (windowMs > 0) {
    // The same track twice in the list, closer together than the window.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (tracks[i]!.id !== tracks[j]!.id) continue;
        let gap = 0;
        for (let k = i; k < j; k++) gap += tracks[k]!.durationMs;
        if (gap < windowMs) {
          issues.push({
            kind: "repeat_window",
            severity: "break",
            positions: [i, j],
            message: `“${tracks[i]!.title}” is at ${i + 1} and ${j + 1}, only ${minutes(gap)} apart. The rule is ${rules.repeatWindowMinutes} minutes.`,
          });
        }
      }
    }
    // The whole list loops sooner than the window, so everything comes round again.
    const cycle = tracks.reduce((a, t) => a + t.durationMs, 0);
    if (cycle < windowMs) {
      issues.push({
        kind: "loop_short",
        severity: "warning",
        positions: [n - 1, 0],
        message: `The list loops after ${minutes(cycle)}, so “${tracks[0]!.title}” comes round again after “${tracks[n - 1]!.title}” within ${rules.repeatWindowMinutes} minutes. Add more songs to stretch it out.`,
      });
    }
  }

  if (!opts.explicitAllowed) {
    tracks.forEach((t, i) => {
      if (t.explicit) {
        issues.push({
          kind: "explicit",
          severity: "warning",
          positions: [i],
          message: `“${t.title}” has explicit lyrics. Business playlists leave these out unless a site has asked for them.`,
        });
      }
    });
  }

  return issues;
}

function minutes(ms: number) {
  return `${Math.round(ms / 60_000)} min`;
}
