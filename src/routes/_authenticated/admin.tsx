import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminButton, Field, Select, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import {
  claimFirstAdmin,
  confirmUpload,
  createUploadTicket,
  deleteRow,
  deleteUpload,
  getAdminStatus,
  listAllContent,
  saveBoardMember,
  saveLibraryItem,
  savePost,
} from "@/lib/admin.functions";
import { SiteTextPanel } from "@/components/admin/SiteTextPanel";
import { EnquiriesPanel } from "@/components/admin/EnquiriesPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Content manager – The Pack" },
      { name: "description", content: "Manage blog posts, library documents and board bios for The Pack." },
      { property: "og:title", content: "Content manager – The Pack" },
      { property: "og:description", content: "Manage blog posts, library documents and board bios for The Pack." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Tab = "text" | "posts" | "library" | "board" | "files" | "enquiries";

const TABS: { id: Tab; label: string }[] = [
  { id: "text", label: "Page text" },
  { id: "posts", label: "Blog posts" },
  { id: "library", label: "Papers, policies & FAQs" },
  { id: "board", label: "Board" },
  { id: "files", label: "Files" },
  { id: "enquiries", label: "Enquiries" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const status = useServerFn(getAdminStatus);
  const claim = useServerFn(claimFirstAdmin);
  const [tab, setTab] = useState<Tab>("text");

  const statusQuery = useQuery({ queryKey: ["admin-status"], queryFn: () => status({}) });

  if (statusQuery.isLoading) {
    return <Shell>Loading…</Shell>;
  }

  if (statusQuery.data && !statusQuery.data.isAdmin) {
    return (
      <Shell>
        <h1 className="text-4xl">Not an admin (yet)</h1>
        {statusQuery.data.anyAdminExists ? (
          <p className="mt-4 max-w-xl text-lg">
            This account isn't set up to edit the site. Ask an existing admin to add you.
          </p>
        ) : (
          <>
            <p className="mt-4 max-w-xl text-lg">
              Nobody has claimed the admin account yet. Since you're first, you can take it.
            </p>
            <div className="mt-6">
              <AdminButton
                tone="go"
                onClick={async () => {
                  await claim({});
                  await queryClient.invalidateQueries();
                }}
              >
                Claim admin access
              </AdminButton>
            </div>
          </>
        )}
        <div className="mt-8">
          <AdminButton
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            Sign out
          </AdminButton>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em]">Pack HQ</p>
          <h1 className="mt-2 text-4xl">Content manager</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/" className="press rounded-full border-2 border-ink px-5 py-2.5 text-xs font-bold uppercase tracking-widest">
            View site
          </Link>
          <AdminButton
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            Sign out
          </AdminButton>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`press rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest ${
              tab === t.id ? "bg-electric text-paper" : "border-2 border-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === "text" ? <SiteTextPanel /> : null}
        {tab === "posts" ? <PostsPanel /> : null}
        {tab === "library" ? <LibraryPanel /> : null}
        {tab === "board" ? <BoardPanel /> : null}
        {tab === "files" ? <FilesPanel /> : null}
        {tab === "enquiries" ? <EnquiriesPanel /> : null}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-5xl px-5 py-12">{children}</div>
    </div>
  );
}

function useContent() {
  const load = useServerFn(listAllContent);
  return useQuery({ queryKey: ["admin-content"], queryFn: () => load({}) });
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_rgba(0,0,0,0.9)]">{children}</div>;
}

/* ---------------- Blog posts ---------------- */

type PostRow = {
  id: string;
  slug: string;
  title: string;
  published_on: string;
  author: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  is_published: boolean;
};

const emptyPost = (): PostRow => ({
  id: "",
  slug: "",
  title: "",
  published_on: new Date().toISOString().slice(0, 10),
  author: "The Pack",
  excerpt: "",
  body: "",
  cover_image: null,
  is_published: true,
});

function PostsPanel() {
  const { data, isLoading } = useContent();
  const queryClient = useQueryClient();
  const save = useServerFn(savePost);
  const remove = useServerFn(deleteRow);
  const [draft, setDraft] = useState<PostRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const coverSection = useRef<HTMLDivElement>(null);
  const [focusPhoto, setFocusPhoto] = useState(false);
  useEffect(() => {
    if (draft && focusPhoto) {
      coverSection.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusPhoto(false);
    }
  }, [draft, focusPhoto]);
  const ticket = useServerFn(createUploadTicket);
  const confirmIt = useServerFn(confirmUpload);

  const posts = (data?.posts ?? []) as PostRow[];

  async function uploadCover(file: File, title: string): Promise<string | null> {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const label = `Blog cover – ${title || file.name}`;
      const t = await ticket({
        data: { fileName: file.name, label, contentType: file.type || "image/jpeg", size: file.size },
      });
      const { error: upErr } = await supabase.storage.from("documents").uploadToSignedUrl(t.path, t.token, file);
      if (upErr) throw new Error(upErr.message);
      const { publicUrl } = await confirmIt({
        data: {
          label,
          fileName: file.name,
          path: t.path,
          contentType: file.type || "image/jpeg",
          size: file.size,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      return publicUrl;
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setPhotoBusy(false);
    }
  }

  async function submit() {
    if (!draft || photoBusy) return;
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          ...(draft.id ? { id: draft.id } : {}),
          slug: draft.slug || slugify(draft.title),
          title: draft.title,
          published_on: draft.published_on,
          author: draft.author,
          excerpt: draft.excerpt,
          body: draft.body,
          cover_image: draft.cover_image,
          is_published: draft.is_published,
        },
      });
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (draft) {
    return (
      <Card>
        <h2 className="text-2xl">{draft.id ? "Edit post" : "New post"}</h2>
        <div className="mt-6 space-y-5">
          <Field label="Title">
            <TextInput
              value={draft.title}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  title: e.target.value,
                  slug: draft.id || draft.slug ? draft.slug : slugify(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Web address" hint={`Appears as /blog/${draft.slug || "your-post"}`}>
            <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date">
              <TextInput
                type="date"
                value={draft.published_on}
                onChange={(e) => setDraft({ ...draft, published_on: e.target.value })}
              />
            </Field>
            <Field label="Author">
              <TextInput value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
            </Field>
          </div>
          <Field
            label="Cover photo"
            hint="Shown wide at the top of the post and cropped on the blog index. Landscape works best — aim for 1600 × 700 pixels (or any wide photo, roughly twice as wide as it is tall). JPG or PNG, under 2 MB keeps the page fast."
          >
            <div ref={coverSection} className="mt-2 flex flex-wrap items-center gap-4">
              {draft.cover_image ? (
                <img
                  src={draft.cover_image}
                  alt={`Cover photo for ${draft.title}`}
                  className="aspect-[16/7] w-full max-w-sm rounded border-2 border-ink object-cover"
                />
              ) : null}
              <input
                ref={coverInput}
                type="file"
                aria-label="Upload blog cover photo"
                accept="image/*"
                disabled={photoBusy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const url = await uploadCover(file, draft.title);
                  if (url) setDraft((d) => (d ? { ...d, cover_image: url } : d));
                }}
                className="hidden"
              />
              <AdminButton disabled={photoBusy || busy} onClick={() => coverInput.current?.click()}>
                {photoBusy ? "Uploading…" : draft.cover_image ? "Change photo" : "Add photo"}
              </AdminButton>
              {draft.cover_image ? (
                <AdminButton disabled={photoBusy || busy} onClick={() => setDraft({ ...draft, cover_image: null })}>Remove photo</AdminButton>
              ) : null}
            </div>
            {photoBusy ? <span className="mt-2 block text-sm">Uploading…</span> : null}
            {photoError ? <span className="mt-2 block text-sm text-ember">{photoError}</span> : null}
          </Field>
          <Field label="Summary" hint="One or two lines shown on the blog index and in search results.">
            <TextArea
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              className=""
            />
          </Field>
          <Field label="Body" hint="Leave a blank line between paragraphs. Start a line with > to make it a pull quote.">
            <TextArea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              style={{ minHeight: "24rem" }}
            />
          </Field>
          <Toggle
            label="Published"
            checked={draft.is_published}
            onChange={(v) => setDraft({ ...draft, is_published: v })}
          />
          {error ? <p className="text-sm font-bold text-ember">{error}</p> : null}
          <div className="flex gap-3">
            <AdminButton tone="go" onClick={submit} disabled={busy || photoBusy}>
              {busy ? "Saving…" : "Save post"}
            </AdminButton>
            <AdminButton disabled={busy || photoBusy} onClick={() => setDraft(null)}>Cancel</AdminButton>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdminButton tone="go" onClick={() => setDraft(emptyPost())}>
        + New post
      </AdminButton>
      {isLoading ? <p>Loading…</p> : null}
      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                {post.cover_image ? (
                  <img src={post.cover_image} alt="" className="h-16 w-24 shrink-0 rounded border-2 border-ink object-cover" />
                ) : null}
                <div className="min-w-0">
                <p className="font-mono text-xs uppercase tracking-[0.25em]">
                  {post.published_on} · {post.author} {post.is_published ? "" : "· DRAFT"}
                </p>
                <h3 className="mt-1 text-xl">{post.title}</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminButton onClick={() => setDraft(post)}>Edit</AdminButton>
                <AdminButton onClick={() => { setDraft(post); setFocusPhoto(true); }}>
                  {post.cover_image ? "Change photo" : "Add photo"}
                </AdminButton>
                <AdminButton
                  tone="danger"
                  onClick={async () => {
                    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
                    await remove({ data: { table: "posts", id: post.id } });
                    await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
                  }}
                >
                  Delete
                </AdminButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Library ---------------- */

type LibraryRow = {
  id: string;
  kind: "paper" | "policy" | "faq";
  title: string;
  label: string;
  body: string;
  href: string | null;
  sort_order: number;
  is_published: boolean;
};

const emptyLibrary = (): LibraryRow => ({
  id: "",
  kind: "paper",
  title: "",
  label: "",
  body: "",
  href: "",
  sort_order: 0,
  is_published: true,
});

function LibraryPanel() {
  const { data } = useContent();
  const queryClient = useQueryClient();
  const save = useServerFn(saveLibraryItem);
  const remove = useServerFn(deleteRow);
  const [draft, setDraft] = useState<LibraryRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<LibraryRow["kind"]>("paper");

  const rows = useMemo(
    () => ((data?.library ?? []) as LibraryRow[]).filter((r) => r.kind === filter),
    [data, filter],
  );
  const files = (data?.uploads ?? []) as { id: string; label: string; public_url: string }[];

  if (draft) {
    const isFaq = draft.kind === "faq";
    return (
      <Card>
        <h2 className="text-2xl">{draft.id ? "Edit item" : "New item"}</h2>
        <div className="mt-6 space-y-5">
          <Field label="Type">
            <Select
              value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value as LibraryRow["kind"] })}
            >
              <option value="paper">Paper</option>
              <option value="policy">Policy</option>
              <option value="faq">FAQ</option>
            </Select>
          </Field>
          <Field label={isFaq ? "Question" : "Title"}>
            <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field
            label={isFaq ? "Group" : "Year / label"}
            hint={isFaq ? "FAQs are grouped under this heading, e.g. 'The basics'." : "Shown above the title."}
          >
            <TextInput value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          </Field>
          <Field label={isFaq ? "Answer" : "Description"} hint="Blank line between paragraphs.">
            <TextArea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </Field>
          {!isFaq ? (
            <Field label="Document link" hint="Pick an uploaded file below, or paste any web link.">
              <TextInput value={draft.href ?? ""} onChange={(e) => setDraft({ ...draft, href: e.target.value })} />
              {files.length ? (
                <Select
                  value=""
                  onChange={(e) => e.target.value && setDraft({ ...draft, href: e.target.value })}
                >
                  <option value="">– use an uploaded file –</option>
                  {files.map((f) => (
                    <option key={f.id} value={f.public_url}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              ) : null}
            </Field>
          ) : null}
          <Field label="Order" hint="Lower numbers appear first.">
            <TextInput
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
            />
          </Field>
          <Toggle label="Published" checked={draft.is_published} onChange={(v) => setDraft({ ...draft, is_published: v })} />
          <div className="flex gap-3">
            <AdminButton
              tone="go"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await save({
                  data: {
                    ...(draft.id ? { id: draft.id } : {}),
                    kind: draft.kind,
                    title: draft.title,
                    label: draft.label,
                    body: draft.body,
                    href: draft.href ? draft.href : null,
                    sort_order: draft.sort_order,
                    is_published: draft.is_published,
                  },
                });
                setBusy(false);
                setDraft(null);
                await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
              }}
            >
              {busy ? "Saving…" : "Save"}
            </AdminButton>
            <AdminButton onClick={() => setDraft(null)}>Cancel</AdminButton>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["paper", "policy", "faq"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`press rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest ${
              filter === k ? "bg-ink text-paper" : "border-2 border-ink"
            }`}
          >
            {k === "faq" ? "FAQs" : `${k}s`}
          </button>
        ))}
      </div>
      <AdminButton tone="go" onClick={() => setDraft({ ...emptyLibrary(), kind: filter })}>
        + New {filter === "faq" ? "FAQ" : filter}
      </AdminButton>
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <p className="font-mono text-xs uppercase tracking-[0.25em]">
                  #{row.sort_order} {row.label ? `· ${row.label}` : ""} {row.is_published ? "" : "· HIDDEN"}
                </p>
                <h3 className="mt-1 text-lg">{row.title}</h3>
              </div>
              <div className="flex gap-2">
                <AdminButton onClick={() => setDraft(row)}>Edit</AdminButton>
                <AdminButton
                  tone="danger"
                  onClick={async () => {
                    if (!confirm(`Delete "${row.title}"?`)) return;
                    await remove({ data: { table: "library_items", id: row.id } });
                    await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
                  }}
                >
                  Delete
                </AdminButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Board ---------------- */

type BoardRow = {
  id: string;
  name: string;
  role: string;
  blurb: string;
  bio: string;
  photo_url: string | null;
  sort_order: number;
  is_published: boolean;
};

const emptyBoard = (): BoardRow => ({
  id: "",
  name: "",
  role: "",
  blurb: "",
  bio: "",
  photo_url: null,
  sort_order: 0,
  is_published: true,
});

function BoardPanel() {
  const { data } = useContent();
  const queryClient = useQueryClient();
  const save = useServerFn(saveBoardMember);
  const remove = useServerFn(deleteRow);
  const [draft, setDraft] = useState<BoardRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const ticket = useServerFn(createUploadTicket);
  const confirmIt = useServerFn(confirmUpload);
  const rows = (data?.board ?? []) as BoardRow[];

  async function uploadPhoto(file: File, name: string): Promise<string | null> {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const label = `Board photo – ${name || file.name}`;
      const t = await ticket({
        data: { fileName: file.name, label, contentType: file.type || "image/jpeg", size: file.size },
      });
      const { error: upErr } = await supabase.storage.from("documents").uploadToSignedUrl(t.path, t.token, file);
      if (upErr) throw new Error(upErr.message);
      const { publicUrl } = await confirmIt({
        data: {
          label,
          fileName: file.name,
          path: t.path,
          contentType: file.type || "image/jpeg",
          size: file.size,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      return publicUrl;
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setPhotoBusy(false);
    }
  }

  if (draft) {
    return (
      <Card>
        <h2 className="text-2xl">{draft.id ? "Edit board member" : "New board member"}</h2>
        <div className="mt-6 space-y-5">
          <Field label="Name">
            <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Role">
            <TextInput value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
          </Field>
          <Field label="One-liner" hint="Shown before the bio is expanded.">
            <TextInput value={draft.blurb} onChange={(e) => setDraft({ ...draft, blurb: e.target.value })} />
          </Field>
          <Field label="Bio">
            <TextArea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
          </Field>
          <Field label="Photo" hint="A square headshot works best — around 600 × 600 pixels. JPG or PNG, under 2 MB.">
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {draft.photo_url ? (
                <img
                  src={draft.photo_url}
                  alt=""
                  className="h-20 w-20 rounded-full border-2 border-ink object-cover"
                />
              ) : null}
              <input
                type="file"
                accept="image/*"
                disabled={photoBusy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const url = await uploadPhoto(file, draft.name);
                  if (url) setDraft((d) => (d ? { ...d, photo_url: url } : d));
                }}
                className="block text-sm normal-case tracking-normal"
              />
              {draft.photo_url ? (
                <AdminButton onClick={() => setDraft({ ...draft, photo_url: null })}>Remove photo</AdminButton>
              ) : null}
            </div>
            {photoBusy ? <span className="mt-2 block text-sm">Uploading…</span> : null}
            {photoError ? <span className="mt-2 block text-sm text-ember">{photoError}</span> : null}
          </Field>
          <Field label="Order">
            <TextInput
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
            />
          </Field>
          <Toggle label="Published" checked={draft.is_published} onChange={(v) => setDraft({ ...draft, is_published: v })} />
          <div className="flex gap-3">
            <AdminButton
              tone="go"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await save({
                  data: {
                    ...(draft.id ? { id: draft.id } : {}),
                    name: draft.name,
                    role: draft.role,
                    blurb: draft.blurb,
                    bio: draft.bio,
                    photo_url: draft.photo_url,
                    sort_order: draft.sort_order,
                    is_published: draft.is_published,
                  },
                });
                setBusy(false);
                setDraft(null);
                await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
              }}
            >
              {busy ? "Saving…" : "Save"}
            </AdminButton>
            <AdminButton onClick={() => setDraft(null)}>Cancel</AdminButton>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdminButton tone="go" onClick={() => setDraft(emptyBoard())}>
        + New board member
      </AdminButton>
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em]">
                  #{row.sort_order} {row.is_published ? "" : "· HIDDEN"}
                </p>
                <h3 className="mt-1 text-lg">
                  {row.name} – <span className="opacity-70">{row.role}</span>
                </h3>
              </div>
              <div className="flex gap-2">
                <AdminButton onClick={() => setDraft(row)}>Edit</AdminButton>
                <AdminButton
                  tone="danger"
                  onClick={async () => {
                    if (!confirm(`Remove ${row.name} from the board page?`)) return;
                    await remove({ data: { table: "board_members", id: row.id } });
                    await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
                  }}
                >
                  Delete
                </AdminButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Files ---------------- */

type UploadRow = {
  id: string;
  label: string;
  file_name: string;
  public_url: string;
  size_bytes: number;
  created_at: string;
};

function FilesPanel() {
  const { data } = useContent();
  const queryClient = useQueryClient();
  const ticket = useServerFn(createUploadTicket);
  const confirmIt = useServerFn(confirmUpload);
  const removeFile = useServerFn(deleteUpload);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = (data?.uploads ?? []) as UploadRow[];

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const t = await ticket({
        data: { fileName: file.name, label, contentType: file.type || "application/octet-stream", size: file.size },
      });
      const { error: upErr } = await supabase.storage.from("documents").uploadToSignedUrl(t.path, t.token, file);
      if (upErr) throw new Error(upErr.message);
      await confirmIt({
        data: {
          label,
          fileName: file.name,
          path: t.path,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        },
      });
      setLabel("");
      await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl">Upload a document or image</h2>
        <p className="mt-2 text-base">
          PDFs, images, anything up to 60&nbsp;MB. Once uploaded you'll get a link you can attach to a paper, a policy
          or a blog post.
        </p>
        <div className="mt-5 space-y-4">
          <Field label="Name it" hint="What you'll see in the list, e.g. 'Ethical AI Policy 2026'.">
            <TextInput value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <input
            type="file"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
            className="block w-full text-sm"
          />
          {busy ? <p className="text-sm font-bold">Uploading…</p> : null}
          {error ? <p className="text-sm font-bold text-ember">{error}</p> : null}
        </div>
      </Card>

      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <h3 className="text-lg">{row.label || row.file_name}</h3>
                <p className="mt-1 break-all font-mono text-xs">{row.public_url}</p>
                <p className="mt-1 font-mono text-xs opacity-70">
                  {(row.size_bytes / 1_000_000).toFixed(2)} MB · {row.file_name}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={row.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="press rounded-full border-2 border-ink px-5 py-2.5 text-xs font-bold uppercase tracking-widest"
                >
                  Open
                </a>
                <AdminButton
                  tone="danger"
                  onClick={async () => {
                    if (!confirm(`Delete "${row.label || row.file_name}"? Links to it will stop working.`)) return;
                    await removeFile({ data: { id: row.id } });
                    await queryClient.invalidateQueries({ queryKey: ["admin-content"] });
                  }}
                >
                  Delete
                </AdminButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
