/**
 * Local demo data: accounts, a small catalogue with real audio, three sites,
 * a published playlist and last month's plays.
 *
 * Run after `supabase db reset` (npm run db:reset does both). Needs ffmpeg.
 * Last month's plays at Example Café reproduce the scope's worked example
 * (section 8): 90 / 70 / 40 qualified plays, $34.99 to artists.
 *
 * Audio is synthetic: generated tones standing in for real masters, each at a
 * different level so loudness levelling (PLY-3) can be heard working.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = join(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);
const sb = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const PASSWORD = "packpack";
const audioDir = join(root, ".demo-audio");
mkdirSync(audioDir, { recursive: true });

async function must<T>(promise: PromiseLike<{ data: T; error: { message: string } | null }>, what: string): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function user(email: string, name: string, roles: string[]) {
  const { data, error } = await sb.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error) throw new Error(`create ${email}: ${error.message}`);
  const id = data.user.id;
  await must(sb.from("profiles").insert({ user_id: id, email, display_name: name }), "profile");
  await must(sb.from("user_roles").insert(roles.map((role) => ({ user_id: id, role }))), "roles");
  return id;
}

async function onboard(userId: string, memberClass: "full" | "associate" | null, extraDocs: string[] = []) {
  const docs = await must(sb.from("documents").select("id,kind").eq("is_current", true), "documents");
  const kinds = ["terms", "privacy", ...extraDocs, ...(memberClass ? ["coop_rules"] : [])];
  await must(
    sb.from("acceptances").insert(docs.filter((d) => kinds.includes(d.kind)).map((d) => ({ user_id: userId, document_id: d.id }))),
    "acceptances",
  );
  if (memberClass) {
    const rules = docs.find((d) => d.kind === "coop_rules")!;
    await must(sb.from("memberships").insert({ user_id: userId, class: memberClass, rules_document_id: rules.id }), "membership");
  }
}

/** A little arpeggio over a pad, at a chosen level, so tracks differ in loudness. */
function makeAudio(slug: string, base: number, seconds: number, gain: number) {
  const out = join(audioDir, `${slug}.mp3`);
  if (!existsSync(out)) {
    const n = "mod(floor(t*2),4)";
    const f = `${base}*pow(2,(4*eq(${n},1)+7*eq(${n},2)+12*eq(${n},3))/12)`;
    const expr = `${gain}*(0.55*sin(2*PI*${f}*t)*exp(-3*mod(t,0.5))+0.25*sin(2*PI*${base / 2}*t)*(0.7+0.3*sin(2*PI*0.25*t)))`;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `aevalsrc=${expr.replaceAll(",", "\\,")}|${expr.replaceAll(",", "\\,")}:s=44100:d=${seconds}`,
      "-af", "afade=t=in:d=1,afade=t=out:st=" + (seconds - 2) + ":d=2", "-b:a", "128k", out]);
  }
  return out;
}

async function upload(bucket: string, path: string, file: string, contentType: string) {
  const { error } = await sb.storage.from(bucket).upload(path, readFileSync(file), { contentType, upsert: true });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
}

async function main() {
  console.log("Accounts…");
  const admin = await user("admin@pack.test", "Alex", ["admin", "curator"]);
  const curator = await user("curator@pack.test", "Priya", ["curator"]);
  const sam = await user("sam@pack.test", "Sam Reilly", ["artist"]);
  const marlo = await user("marlo@pack.test", "Marlo Finch", ["artist"]);
  const dune = await user("dune@pack.test", "Dune Season", ["artist"]);
  const cafeOwner = await user("cafe@pack.test", "Mia", ["business_owner"]);
  const jess = await user("jess@pack.test", "Jess Morgan", ["business_staff"]);
  const booksOwner = await user("books@pack.test", "Tom", ["business_owner"]);
  const listener = await user("listener@pack.test", "Ravi", ["listener"]);
  await onboard(admin, null);
  await onboard(curator, null);
  for (const a of [sam, marlo, dune]) await onboard(a, "full", ["artist_agreement"]);
  for (const b of [cafeOwner, booksOwner]) await onboard(b, "associate");
  await onboard(jess, null);
  await onboard(listener, null);

  console.log("Artists and people…");
  const artist = async (userId: string, name: string, legal: string, region: string, bio: string) => {
    const row = await must(
      sb.from("artists").insert({ user_id: userId, public_name: name, legal_name: legal, region, bio, cohort: "Fremantle 1" }).select("id").single(),
      "artist",
    );
    const person = await must(sb.from("people").insert({ name: legal, user_id: userId }).select("id").single(), "person");
    return { artistId: row.id, personId: person.id };
  };
  const southerlies = await artist(sam, "The Southerlies", "Samuel Reilly", "fremantle",
    "Four friends, one van, and a shared love of slow songs about the tide.");
  const finch = await artist(marlo, "Marlo Finch", "Marlo Finch", "margaret-river",
    "Songs written on a borrowed piano in a shed near the river mouth.");
  const season = await artist(dune, "Dune Season", "Dana Okafor", "perth", "Warm synths, cold beer, long summers.");
  // Jo Tan wrote on Night Bus but has no account yet: their share is held for them (PAY-8).
  const jo = await must(sb.from("people").insert({ name: "Jo Tan", email: "jo@pack.test" }).select("id").single(), "jo");

  console.log("Music (generating audio with ffmpeg)…");
  type TrackSpec = { slug: string; title: string; base: number; gain: number; seconds: number; genre: string; tags: string[]; splits: [string, string, number][] };
  const releaseSpecs: {
    artist: { artistId: string; personId: string };
    title: string;
    type: "single" | "ep" | "album";
    upc: string;
    art: string;
    state: "live" | "in_review";
    tracks: TrackSpec[];
  }[] = [
    {
      artist: southerlies, title: "Salt and Static", type: "album", upc: "0601234567890", art: "road", state: "live",
      tracks: [
        { slug: "long-way-down", title: "Long Way Down", base: 220, gain: 0.9, seconds: 95, genre: "rock-indie", tags: ["setting-cafe", "energy-medium", "vocals-led"], splits: [[southerlies.personId, "Writer, performer", 10000]] },
        { slug: "tide-tables", title: "Tide Tables", base: 196, gain: 0.35, seconds: 85, genre: "folk-acoustic", tags: ["setting-cafe", "energy-low", "time-morning"], splits: [[southerlies.personId, "Writer, performer", 10000]] },
        { slug: "night-bus", title: "Night Bus", base: 247, gain: 0.6, seconds: 90, genre: "rock-indie", tags: ["setting-bar", "time-evening"], splits: [[southerlies.personId, "Writer, performer", 6000], [jo.id, "Writer", 4000]] },
      ],
    },
    {
      artist: finch, title: "Slow Water", type: "single", upc: "0601234567906", art: "tea", state: "live",
      tracks: [{ slug: "slow-water", title: "Slow Water", base: 262, gain: 0.25, seconds: 100, genre: "folk-alt", tags: ["setting-cafe", "energy-low", "time-morning", "tempo-slow"], splits: [[finch.personId, "Writer, performer", 10000]] }],
    },
    {
      artist: season, title: "Paper Boats", type: "ep", upc: "0601234567913", art: "cassettes", state: "live",
      tracks: [
        { slug: "paper-boats", title: "Paper Boats", base: 175, gain: 0.7, seconds: 80, genre: "pop-dream", tags: ["setting-cafe", "energy-medium", "time-afternoon"], splits: [[season.personId, "Writer, performer", 10000]] },
        { slug: "harbour-light", title: "Harbour Light", base: 294, gain: 0.45, seconds: 75, genre: "electronic-ambient", tags: ["setting-retail", "energy-low", "vocals-instrumental"], splits: [[season.personId, "Writer, producer", 10000]] },
      ],
    },
    {
      artist: southerlies, title: "Kestrel Road", type: "ep", upc: "0601234567920", art: "drone", state: "in_review",
      tracks: [
        { slug: "kestrel-road", title: "Kestrel Road", base: 208, gain: 0.8, seconds: 70, genre: "rock-indie", tags: [], splits: [[southerlies.personId, "Writer, performer", 10000]] },
        { slug: "quiet-rooms", title: "Quiet Rooms", base: 233, gain: 0.3, seconds: 70, genre: "folk-acoustic", tags: [], splits: [[southerlies.personId, "Writer, performer", 10000]] },
      ],
    },
  ];

  const trackIds: Record<string, string> = {};
  const now = new Date().toISOString();
  let isrc = 1;
  for (const spec of releaseSpecs) {
    await upload("artwork", `${spec.upc}.jpg`, join(root, "public/demo-art", `${spec.art}.jpg`), "image/jpeg");
    const { data: art } = sb.storage.from("artwork").getPublicUrl(`${spec.upc}.jpg`);
    const release = await must(
      sb.from("releases").insert({
        artist_id: spec.artist.artistId, title: spec.title, type: spec.type, upc: spec.upc, artwork_url: art.publicUrl,
        rights_status: "unsigned", rights_confirmed_at: now, splits_confirmed_at: now, state: spec.state,
        submitted_at: now, reviewed_at: spec.state === "live" ? now : null, reviewed_by: spec.state === "live" ? admin : null,
      }).select("id").single(),
      "release",
    );
    await must(sb.from("release_events").insert([
      { release_id: release.id, from_state: null, to_state: "received", actor: null },
      { release_id: release.id, from_state: "received", to_state: "in_review", actor: null },
      ...(spec.state === "live" ? [{ release_id: release.id, from_state: "in_review" as const, to_state: "live" as const, actor: admin, reason: "Seeded" }] : []),
    ]), "events");

    for (const [index, t] of spec.tracks.entries()) {
      const file = makeAudio(t.slug, t.base, t.seconds, t.gain);
      const loud = measureLoudness(file);
      const path = `${release.id}/${t.slug}.mp3`;
      await upload("audio", path, file, "audio/mpeg");
      const track = await must(
        sb.from("tracks").insert({
          release_id: release.id, position: index + 1, title: t.title, isrc: `AUXX02600${String(isrc++).padStart(3, "0")}`,
          duration_ms: t.seconds * 1000, audio_path: path, genre_id: t.genre, ai_declaration: "no", ai_declared_at: now,
          lufs: loud.lufs, true_peak: loud.truePeak, lra: loud.lra,
        }).select("id").single(),
        "track",
      );
      trackIds[t.slug] = track.id;
      if (t.tags.length) await must(sb.from("track_descriptors").insert(t.tags.map((descriptor_id) => ({ track_id: track.id, descriptor_id }))), "tags");
      const set = await must(sb.from("split_sets").insert({ track_id: track.id, confirmed_at: now, confirmed_by: sam }).select("id").single(), "split set");
      await must(sb.from("splits").insert(t.splits.map(([person_id, role, share_bp]) => ({ split_set_id: set.id, person_id, role, share_bp }))), "splits");
      console.log(`  ${t.title}: ${loud.lufs} LUFS, true peak ${loud.truePeak}`);
    }
  }

  console.log("Businesses and sites…");
  const business = async (name: string, owner: string) =>
    (await must(sb.from("businesses").insert({ name, owner_user_id: owner }).select("id").single(), "business")).id;
  const site = async (row: Record<string, unknown>) => (await must(sb.from("sites").insert(row).select("id").single(), "site")).id;
  const cafeBiz = await business("Example Café", cafeOwner);
  const cafe = await site({
    business_id: cafeBiz, name: "Example Café", address: "12 High Street, Fremantle", region: "fremantle", business_type: "Café",
    opening_hours: "Mon to Fri 7 am to 3 pm, Sat and Sun 8 am to 2 pm", player_start: "07:00", player_end: "09:00",
    vibe: "A corner café with big windows, strong coffee and the local songs turned low.", short_code: "exa", licensing_accepted_at: now,
  });
  await must(sb.from("site_staff").insert({ site_id: cafe, user_id: jess, display_name: "Jess Morgan" }), "staff");
  const books = await site({
    business_id: await business("Corner Books", booksOwner), name: "Corner Books", address: "3 Market Street, Fremantle", region: "fremantle",
    business_type: "Retail", opening_hours: "Every day 9 am to 5 pm", player_start: "13:00", player_end: "15:00",
    vibe: "Second-hand books and quiet afternoons.", short_code: "cor", licensing_accepted_at: now,
  });
  const salon = await site({
    business_id: await business("Harbour Salon", booksOwner), name: "Harbour Salon", address: "40 South Terrace, Fremantle", region: "fremantle",
    business_type: "Salon", opening_hours: "Tue to Sat 9 am to 6 pm", player_start: "10:00", player_end: "12:00",
    vibe: "Bright, busy and a bit loud on Saturdays.", short_code: "har", licensing_accepted_at: now,
  });

  console.log("Playlist…");
  const playlist = await must(sb.from("playlists").insert({ name: "Weekday morning, café", curator_user_id: admin, curated_by: "Alex & The Pack" }).select("id").single(), "playlist");
  const version = await must(sb.from("playlist_versions").insert({ playlist_id: playlist.id, version: 1, published_at: now, published_by: admin }).select("id").single(), "version");
  const order = ["slow-water", "tide-tables", "paper-boats", "long-way-down", "harbour-light", "night-bus"];
  await must(sb.from("playlist_tracks").insert(order.map((slug, i) => ({ playlist_version_id: version.id, position: i + 1, track_id: trackIds[slug]! }))), "playlist tracks");
  await must(sb.from("site_assignments").insert([cafe, books, salon].map((site_id) => ({ site_id, playlist_version_id: version.id, assigned_by: admin }))), "assignments");

  console.log("Last month's plays…");
  const today = new Date();
  const lastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const events: Record<string, unknown>[] = [];
  const addPlays = (siteId: string, slug: string, count: number, seconds = 200) => {
    for (let i = 0; i < count; i++) {
      const started = new Date(lastMonth.getTime() + (i % 28) * 86400000 + 7 * 3600000 + i * 61000);
      events.push({ id: randomUUID(), site_id: siteId, track_id: trackIds[slug], playlist_version_id: version.id, started_at: started.toISOString(), seconds_played: seconds });
    }
  };
  // Worked example, section 8.
  addPlays(cafe, "night-bus", 90);
  addPlays(cafe, "tide-tables", 70);
  addPlays(cafe, "slow-water", 40);
  addPlays(cafe, "paper-boats", 12, 20); // skipped early: under 30 seconds, never counts
  addPlays(books, "harbour-light", 30);
  addPlays(books, "slow-water", 25);
  addPlays(books, "long-way-down", 5);
  for (let i = 0; i < events.length; i += 200) await must(sb.from("play_events").insert(events.slice(i, i + 200)), "plays");

  await must(sb.from("saves").insert({ user_id: listener, track_id: trackIds["long-way-down"]!, site_id: cafe }), "save");
  await must(sb.from("skips").insert([
    { site_id: salon, track_id: trackIds["tide-tables"]!, reason: "Wrong energy" },
    { site_id: cafe, track_id: trackIds["long-way-down"]!, reason: "Too loud" },
  ]), "skips");

  console.log(`\nDone. Sign in at ${env.APP_URL ?? "http://localhost:3000"} with any *@pack.test account, password "${PASSWORD}".`);
}

/** Measures integrated loudness, true peak and range to EBU R128, as MetaGen would (PLY-1). */
function measureLoudness(file: string) {
  const run = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"], {
    encoding: "utf8",
  });
  return parseLoudness(run.stderr);
}

function parseLoudness(text: string) {
  const json = JSON.parse(text.slice(text.lastIndexOf("{"), text.lastIndexOf("}") + 1));
  return { lufs: Number(json.input_i), truePeak: Number(json.input_tp), lra: Number(json.input_lra) };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
