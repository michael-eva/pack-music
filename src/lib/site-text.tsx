import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SITE_COPY } from "@/content/copy";

/**
 * Editable site copy.
 *
 * Every editable string on the public pages is wrapped in <T k="...">default</T>.
 * The children are the built-in default, so the site always renders even before
 * anyone has edited anything. If an admin saves an override in Admin → Page text,
 * that value replaces the default.
 */

/** Look of one text block, saved by an admin. Any field can be left unset. */
export type TextStyle = {
  /** Typeface: headline (Fredoka), body (Inter) or mono (Space Mono). */
  font?: "display" | "sans" | "mono";
  /** Size relative to the design default, e.g. 1.25 = 25% bigger. */
  size?: number;
  weight?: number;
  transform?: "none" | "uppercase" | "capitalize" | "lowercase";
  italic?: boolean;
};

const STYLE_PREFIX = "style:";

const SiteTextContext = createContext<{
  text: Record<string, string>;
  styles: Record<string, TextStyle>;
}>({ text: {}, styles: {} });

export const siteTextQueryOptions = {
  queryKey: ["site-text"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_text").select("key,value");
    if (error) throw new Error(error.message);
    const text: Record<string, string> = {};
    const styles: Record<string, TextStyle> = {};
    for (const row of data ?? []) {
      if (!row.value || !row.value.trim()) continue;
      if (row.key.startsWith(STYLE_PREFIX)) {
        try {
          styles[row.key.slice(STYLE_PREFIX.length)] = JSON.parse(row.value) as TextStyle;
        } catch {
          /* ignore malformed style */
        }
      } else {
        text[row.key] = row.value;
      }
    }
    return { text, styles };
  },
  staleTime: 60_000,
};

export function SiteTextProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery(siteTextQueryOptions);
  return (
    <SiteTextContext.Provider value={data ?? { text: {}, styles: {} }}>
      {children}
    </SiteTextContext.Provider>
  );
}

/** Returns the admin override for a key, or the built-in copy, or undefined. */
export function useSiteText(key: string) {
  return useContext(SiteTextContext).text[key] ?? SITE_COPY[key];
}

/** Returns the saved look for a key, if an admin set one. */
export function useTextStyle(key: string): TextStyle | undefined {
  return useContext(SiteTextContext).styles[key];
}

/** Turns a saved look into inline CSS. */
export function styleToCss(style: TextStyle | undefined) {
  if (!style) return undefined;
  const css: Record<string, string> = {};
  if (style.font) css["fontFamily"] = `var(--font-${style.font})`;
  if (style.size && style.size !== 1) css["fontSize"] = `${style.size}em`;
  if (style.weight) css["fontWeight"] = String(style.weight);
  if (style.transform && style.transform !== "none") css["textTransform"] = style.transform;
  if (style.italic) css["fontStyle"] = "italic";
  return Object.keys(css).length ? (css as React.CSSProperties) : undefined;
}

/**
 * Renders an editable string. `children` is the default copy shipped with the site.
 * Overrides keep line breaks, so multi-line text can be typed in the admin.
 */
export function T({ k, children }: { k: string; children?: ReactNode }) {
  const override = useSiteText(k);
  const css = styleToCss(useTextStyle(k));
  const content =
    override === undefined ? (
      children
    ) : (
      <>
        {override.split("\n").map((line, i) => (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </>
    );
  if (!css) return <>{content}</>;
  return <span style={css}>{content}</span>;
}

/** Plain-string version, for props like alt text or button labels. */
export function useText(key: string, fallback: string) {
  return useSiteText(key) ?? fallback;
}
