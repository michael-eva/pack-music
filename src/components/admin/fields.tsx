import type { ReactNode } from "react";

const base =
  "mt-2 w-full rounded-xl border-2 border-ink bg-paper px-4 py-3 text-base text-ink outline-none focus:ring-4 focus:ring-yellow";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-bold uppercase tracking-widest">
      {label}
      {children}
      {hint ? <span className="mt-1 block font-normal normal-case tracking-normal opacity-70">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={base} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} min-h-40 leading-relaxed`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={base} />;
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-current"
      />
      {label}
    </label>
  );
}

export function AdminButton({
  children,
  tone = "ink",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "ink" | "danger" | "go" }) {
  const tones = {
    ink: "bg-ink text-paper",
    danger: "bg-ember text-paper",
    go: "bg-lime text-ink",
  } as const;
  return (
    <button
      {...rest}
      className={`press rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-60 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
