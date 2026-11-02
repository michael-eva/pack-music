import { db } from "./auth.server";

/** Short-lived links to private audio in the "audio" bucket. Server only. */
export async function signedAudioUrls(paths: string[], expiresInSeconds = 60 * 60 * 3): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return new Map();
  const sb = await db();
  const { data, error } = await sb.storage.from("audio").createSignedUrls(unique, expiresInSeconds);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl]));
}
