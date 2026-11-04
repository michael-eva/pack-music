/**
 * Local demo data: accounts, a small catalogue with real audio files, and
 * featured playlists for the listener home.
 *
 * Run after `supabase db reset` (npm run db:reset does both). Needs ffmpeg.
 * To load a hosted database instead: ENV_FILE=.env.production.local node scripts/seed-demo.ts
 *
 * Audio is synthetic: generated tones standing in for real masters, each at a
 * different level so loudness levelling can be heard working.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(join(root, process.env.ENV_FILE ?? ".env"), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [
      line.slice(0, line.indexOf("=")),
      line.slice(line.indexOf("=") + 1).replace(/^"(.*)"$/, "$1"),
    ]),
);
const sb = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const PASSWORD = "packpack";
const audioDir = join(root, ".demo-audio");
mkdirSync(audioDir, { recursive: true });

async function must<T>(
  promise: PromiseLike<{ data: T; error: { message: string } | null }>,
  what: string,
): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function user(email: string, name: string, roles: string[]) {
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`create ${email}: ${error.message}`);
  const id = data.user.id;
  await must(sb.from("profiles").insert({ user_id: id, email, display_name: name }), "profile");
  await must(sb.from("user_roles").insert(roles.map((role) => ({ user_id: id, role }))), "roles");
  const docs = await must(sb.from("documents").select("id").eq("is_current", true), "documents");
  await must(
    sb.from("acceptances").insert(docs.map((d) => ({ user_id: id, document_id: d.id }))),
    "acceptances",
  );
  return id;
}

/** A little arpeggio over a pad, at a chosen level, so tracks differ in loudness. */
function makeAudio(slug: string, base: number, seconds: number, gain: number) {
  const out = join(audioDir, `${slug}.mp3`);
  if (!existsSync(out)) {
    const n = "mod(floor(t*2),4)";
    const f = `${base}*pow(2,(4*eq(${n},1)+7*eq(${n},2)+12*eq(${n},3))/12)`;
    const expr = `${gain}*(0.55*sin(2*PI*${f}*t)*exp(-3*mod(t,0.5))+0.25*sin(2*PI*${base / 2}*t)*(0.7+0.3*sin(2*PI*0.25*t)))`;
    const src = expr.replaceAll(",", "\\,");
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      `aevalsrc=${src}|${src}:s=44100:d=${seconds}`,
      "-af",
      `afade=t=in:d=1,afade=t=out:st=${seconds - 2}:d=2`,
      "-b:a",
      "128k",
      out,
    ]);
  }
  return out;
}

/** Integrated loudness, true peak and range to EBU R128. */
function measureLoudness(file: string) {
  const run = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-nostats",
      "-i",
      file,
      "-af",
      "loudnorm=print_format=json",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" },
  );
  const text = run.stderr;
  const json = JSON.parse(text.slice(text.lastIndexOf("{"), text.lastIndexOf("}") + 1));
  return {
    lufs: Number(json.input_i),
    truePeak: Number(json.input_tp),
    lra: Number(json.input_lra),
  };
}

async function upload(bucket: string, path: string, file: string, contentType: string) {
  const { error } = await sb.storage
    .from(bucket)
    .upload(path, readFileSync(file), { contentType, upsert: true });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
}

type TrackSpec = {
  slug: string;
  title: string;
  base: number;
  gain: number;
  seconds: number;
  genre: string;
  tags: string[];
  explicit?: boolean;
};
type ReleaseSpec = {
  title: string;
  type: "single" | "ep" | "album";
  upc: string;
  art: string;
  tracks: TrackSpec[];
};
type ArtistSpec = { name: string; region: string; bio: string; releases: ReleaseSpec[] };

const CATALOGUE: ArtistSpec[] = [
  {
    name: "The Southerlies",
    region: "fremantle",
    bio: "Four friends, one van, and a shared love of slow songs about the tide.",
    releases: [
      {
        title: "Salt and Static",
        type: "album",
        upc: "0601234567897",
        art: "road",
        tracks: [
          {
            slug: "long-way-down",
            title: "Long Way Down",
            base: 220,
            gain: 0.9,
            seconds: 95,
            genre: "rock-indie",
            tags: ["setting-cafe", "energy-medium", "vocals-led"],
          },
          {
            slug: "tide-tables",
            title: "Tide Tables",
            base: 196,
            gain: 0.35,
            seconds: 85,
            genre: "folk-acoustic",
            tags: ["energy-low", "time-morning"],
          },
          {
            slug: "night-bus",
            title: "Night Bus",
            base: 247,
            gain: 0.6,
            seconds: 90,
            genre: "rock-indie",
            tags: ["time-evening"],
          },
          {
            slug: "kestrel-road",
            title: "Kestrel Road",
            base: 208,
            gain: 0.8,
            seconds: 80,
            genre: "rock-indie",
            tags: ["energy-high"],
          },
        ],
      },
    ],
  },
  {
    name: "Marlo Finch",
    region: "margaret-river",
    bio: "Songs written on a borrowed piano in a shed near the river mouth.",
    releases: [
      {
        title: "Slow Water",
        type: "ep",
        upc: "0601234567903",
        art: "tea",
        tracks: [
          {
            slug: "slow-water",
            title: "Slow Water",
            base: 262,
            gain: 0.25,
            seconds: 100,
            genre: "folk-alt",
            tags: ["energy-low", "time-morning", "tempo-slow"],
          },
          {
            slug: "quiet-rooms",
            title: "Quiet Rooms",
            base: 233,
            gain: 0.3,
            seconds: 75,
            genre: "folk-acoustic",
            tags: ["energy-low"],
          },
        ],
      },
    ],
  },
  {
    name: "Dune Season",
    region: "perth",
    bio: "Warm synths, cold beer, long summers.",
    releases: [
      {
        title: "Paper Boats",
        type: "ep",
        upc: "0601234567910",
        art: "cassettes",
        tracks: [
          {
            slug: "paper-boats",
            title: "Paper Boats",
            base: 175,
            gain: 0.7,
            seconds: 80,
            genre: "pop-dream",
            tags: ["energy-medium", "time-afternoon"],
          },
          {
            slug: "harbour-light",
            title: "Harbour Light",
            base: 294,
            gain: 0.45,
            seconds: 75,
            genre: "electronic-ambient",
            tags: ["vocals-instrumental"],
          },
        ],
      },
    ],
  },
  {
    name: "Glass Kitchen",
    region: "vincent",
    bio: "A four-piece from Leederville who play loud and apologise afterwards.",
    releases: [
      {
        title: "Fluoro",
        type: "single",
        upc: "0601234567934",
        art: "glitter",
        tracks: [
          {
            slug: "fluoro",
            title: "Fluoro",
            base: 330,
            gain: 0.85,
            seconds: 70,
            genre: "punk",
            tags: ["energy-high", "tempo-fast"],
            explicit: true,
          },
        ],
      },
    ],
  },
  {
    name: "Wren & the Wheatbelt",
    region: "wheatbelt",
    bio: "Country songs from a long way out of town.",
    releases: [
      {
        title: "Long Paddock",
        type: "ep",
        upc: "0601234567941",
        art: "drone",
        tracks: [
          {
            slug: "long-paddock",
            title: "Long Paddock",
            base: 185,
            gain: 0.5,
            seconds: 90,
            genre: "country-australian",
            tags: ["energy-low", "time-afternoon"],
          },
          {
            slug: "silo-lights",
            title: "Silo Lights",
            base: 208,
            gain: 0.55,
            seconds: 85,
            genre: "country-australian",
            tags: ["time-evening"],
          },
        ],
      },
    ],
  },
  {
    name: "Tidal Office",
    region: "bunbury",
    bio: "Bedroom house music from the South West.",
    releases: [
      {
        title: "Back Beach",
        type: "single",
        upc: "0601234567958",
        art: "local-listening",
        tracks: [
          {
            slug: "back-beach",
            title: "Back Beach",
            base: 277,
            gain: 0.65,
            seconds: 95,
            genre: "electronic-house",
            tags: ["energy-medium", "time-late"],
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Accounts…");
  const admin = await user("admin@pack.test", "Alex", ["admin", "curator"]);
  const curator = await user("curator@pack.test", "Priya", ["curator"]);
  const listener = await user("listener@pack.test", "Ravi", ["listener"]);

  console.log("Music (generating audio with ffmpeg)…");
  const trackIds: Record<string, string> = {};
  const now = new Date().toISOString();
  let isrc = 1;
  for (const a of CATALOGUE) {
    const artist = await must(
      sb
        .from("artists")
        .insert({ name: a.name, region: a.region, bio: a.bio })
        .select("id")
        .single(),
      "artist",
    );
    for (const r of a.releases) {
      await upload(
        "artwork",
        `${r.upc}.jpg`,
        join(root, "public/demo-art", `${r.art}.jpg`),
        "image/jpeg",
      );
      const { data: art } = sb.storage.from("artwork").getPublicUrl(`${r.upc}.jpg`);
      const release = await must(
        sb
          .from("releases")
          .insert({
            artist_id: artist.id,
            title: r.title,
            type: r.type,
            upc: r.upc,
            artwork_url: art.publicUrl,
            state: "live",
            published_at: now,
            created_by: admin,
          })
          .select("id")
          .single(),
        "release",
      );
      for (const [index, t] of r.tracks.entries()) {
        const file = makeAudio(t.slug, t.base, t.seconds, t.gain);
        const loud = measureLoudness(file);
        const path = `${release.id}/${t.slug}.mp3`;
        await upload("audio", path, file, "audio/mpeg");
        const track = await must(
          sb
            .from("tracks")
            .insert({
              release_id: release.id,
              position: index + 1,
              title: t.title,
              isrc: `AUXX02600${String(isrc++).padStart(3, "0")}`,
              duration_ms: t.seconds * 1000,
              audio_path: path,
              genre_id: t.genre,
              ai_declaration: "no",
              explicit: t.explicit ?? false,
              lufs: loud.lufs,
              true_peak: loud.truePeak,
              lra: loud.lra,
            })
            .select("id")
            .single(),
          "track",
        );
        trackIds[t.slug] = track.id;
        if (t.tags.length)
          await must(
            sb
              .from("track_descriptors")
              .insert(t.tags.map((descriptor_id) => ({ track_id: track.id, descriptor_id }))),
            "tags",
          );
        console.log(`  ${a.name} – ${t.title}: ${loud.lufs} LUFS`);
      }
    }
  }

  console.log("Playlists…");
  const playlists: {
    name: string;
    description: string;
    curator: string;
    by: string;
    art: string;
    slugs: string[];
  }[] = [
    {
      name: "Weekday morning",
      description: "Slow coffee, big windows, the local songs turned low.",
      curator: admin,
      by: "Alex & The Pack",
      art: "tea",
      slugs: [
        "slow-water",
        "tide-tables",
        "paper-boats",
        "long-paddock",
        "quiet-rooms",
        "harbour-light",
      ],
    },
    {
      name: "Fremantle after dark",
      description: "Port city songs for the walk home.",
      curator: curator,
      by: "Priya & The Pack",
      art: "closed-venue",
      slugs: ["night-bus", "back-beach", "long-way-down", "silo-lights", "kestrel-road"],
    },
    {
      name: "Turn it up",
      description: "Loud, fast and local.",
      curator: admin,
      by: "Alex & The Pack",
      art: "gig-work",
      slugs: ["kestrel-road", "fluoro", "long-way-down", "back-beach", "paper-boats"],
    },
  ];
  for (const [i, p] of playlists.entries()) {
    await upload(
      "artwork",
      `playlist-${i}.jpg`,
      join(root, "public/demo-art", `${p.art}.jpg`),
      "image/jpeg",
    );
    const { data: cover } = sb.storage.from("artwork").getPublicUrl(`playlist-${i}.jpg`);
    const row = await must(
      sb
        .from("playlists")
        .insert({
          name: p.name,
          description: p.description,
          curator_user_id: p.curator,
          curated_by: p.by,
          cover_url: cover.publicUrl,
          is_featured: true,
          featured_order: i,
        })
        .select("id")
        .single(),
      "playlist",
    );
    const version = await must(
      sb
        .from("playlist_versions")
        .insert({ playlist_id: row.id, version: 1, published_at: now, published_by: p.curator })
        .select("id")
        .single(),
      "version",
    );
    await must(
      sb.from("playlist_tracks").insert(
        p.slugs.map((slug, position) => ({
          playlist_version_id: version.id,
          position: position + 1,
          track_id: trackIds[slug]!,
        })),
      ),
      "playlist tracks",
    );
  }

  await must(
    sb.from("saves").insert({ user_id: listener, track_id: trackIds["long-way-down"]! }),
    "save",
  );

  console.log(
    `\nDone. Sign in at ${env.APP_URL ?? "http://localhost:3000"} with any *@pack.test account, password "${PASSWORD}".`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
