import type { CopyGroup } from "./types";
import { homeCopy } from "./home";
import { aboutCopy } from "./about";
import { artistsCopy } from "./artists";
import { listenersCopy } from "./listeners";
import { partnersCopy } from "./partners";
import { joinCopy } from "./join";
import { blogCopy } from "./blog";
import { libraryCopy } from "./library";
import { boardCopy } from "./board";
import { storyCopy } from "./story";
import { coopModelCopy } from "./coop-model";
import { supportCopy } from "./support";
import { ambassadorCopy } from "./ambassador";
import { patronCopy } from "./patron";
import { contactCopy } from "./contact";

/** Every editable page, in navigation order. */
export const COPY_GROUPS: CopyGroup[] = [
  homeCopy,
  aboutCopy,
  storyCopy,
  coopModelCopy,
  boardCopy,
  artistsCopy,
  listenersCopy,
  partnersCopy,
  libraryCopy,
  blogCopy,
  supportCopy,
  ambassadorCopy,
  patronCopy,
  contactCopy,
  joinCopy,
];

/** Flat map of built-in copy: key -> default text. */
export const SITE_COPY: Record<string, string> = Object.assign(
  {},
  ...COPY_GROUPS.map((g) => g.text),
);

export type { CopyGroup, CopyField } from "./types";
