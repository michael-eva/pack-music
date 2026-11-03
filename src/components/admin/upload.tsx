import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createUploadUrl } from "@/lib/music.functions";
import { errorMessage } from "@/components/app/ui";

/** Uploads straight to storage with a signed URL from the server; the file never passes through our server. */
export async function uploadFile(bucket: "audio" | "artwork", scope: string, file: File) {
  const ticket = await createUploadUrl({
    data: { bucket, scope, fileName: file.name, size: file.size },
  });
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(
      ticket.path,
      ticket.token,
      file,
      file.type ? { contentType: file.type } : {},
    );
  if (error) throw new Error(`The upload didn't finish: ${error.message}`);
  return { path: ticket.path, publicUrl: ticket.publicUrl };
}

/** A square image picker for covers, artwork and artist photos (public artwork bucket). */
export function ImageUpload({
  value,
  onChange,
  scope,
  label = "Image",
  disabled = false,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  scope: string;
  label?: string;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      <div className="mt-1.5 flex items-center gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-paper">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="space-y-2 text-sm">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              setError(null);
              try {
                const { publicUrl } = await uploadFile("artwork", scope, file);
                onChange(publicUrl);
              } catch (err) {
                setError(errorMessage(err));
              } finally {
                setBusy(false);
              }
            }}
          />
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => input.current?.click()}
            className="press rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          {value && !disabled ? (
            <button type="button" className="ml-2 text-xs underline" onClick={() => onChange(null)}>
              Remove
            </button>
          ) : null}
          <p className="text-xs text-ink/60">Square JPEG or PNG, at least 1400 px.</p>
          {error ? <p className="text-xs font-bold text-ember">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
