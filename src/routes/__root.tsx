import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { PackLogo } from "@/components/site/PackLogo";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteTextProvider } from "@/lib/site-text";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-8xl text-electric">404</h1>
        <h2 className="mt-4 text-2xl">Nothing playing here</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Stanley sniffed around. This page doesn't exist.
        </p>
        <Link
          to="/"
          className="press mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-bold uppercase tracking-widest text-paper"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again, or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="press rounded-full bg-electric px-6 py-3 text-sm font-bold uppercase tracking-widest text-paper"
          >
            Try again
          </button>
          <a
            href="/"
            className="press rounded-full bg-cream px-6 py-3 text-sm font-bold uppercase tracking-widest"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Pack – Musician-owned streaming, Australia" },
      {
        name: "description",
        content:
          "The Pack is Australia's musician-owned streaming co-operative. 70% of every dollar goes straight to the artists you actually played.",
      },
      { property: "og:site_name", content: "The Pack Music Co-operative" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "The Pack Music Co-operative",
          description:
            "Australia's musician-owned streaming co-operative. 70% of every subscription dollar goes directly to the artists you listen to.",
          areaServed: "AU",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <HeadContent />
      </head>
      <body>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="rough-text" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="4.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const JOIN_BUTTON: Record<string, string> = {
  "/": "bg-yellow text-ink",
  "/artists": "bg-cyan text-ink",
  "/listeners": "bg-lime text-ink",
  "/partners": "bg-magenta text-paper",
  "/about": "bg-electric text-paper",
  "/join": "bg-yellow text-ink",
  "/blog": "bg-magenta text-paper",
  "/governance": "bg-yellow text-ink",
  "/papers": "bg-yellow text-ink",
  "/policies": "bg-yellow text-ink",
  "/faqs": "bg-yellow text-ink",
  "/support": "bg-cyan text-ink",
  "/ambassador": "bg-yellow text-ink",
  "/patron": "bg-magenta text-paper",
  "/story": "bg-yellow text-ink",
  "/coop-model": "bg-magenta text-paper",
  "/board": "bg-cyan text-ink",
  "/contact": "bg-lime text-ink",
};

const LOGO_COLOR: Record<string, string> = {
  "/": "text-yellow",
  "/artists": "text-cyan",
  "/listeners": "text-lime",
  "/partners": "text-magenta",
  "/about": "text-electric",
  "/join": "text-yellow",
  "/blog": "text-magenta",
  "/governance": "text-yellow",
  "/papers": "text-yellow",
  "/policies": "text-yellow",
  "/faqs": "text-yellow",
  "/support": "text-cyan",
  "/ambassador": "text-yellow",
  "/patron": "text-magenta",
  "/story": "text-yellow",
  "/coop-model": "text-magenta",
  "/board": "text-cyan",
  "/contact": "text-lime",
};

type NavLink = { to: string; label: string };
type NavItem = { label: string; to: string; children?: NavLink[] };

const NAV: NavItem[] = [
  {
    label: "About",
    to: "/about",
    children: [
      { to: "/about", label: "About The Pack" },
      { to: "/story", label: "Our story" },
      { to: "/coop-model", label: "Co-op model" },
      { to: "/board", label: "Our board" },
    ],
  },
  { label: "Artists", to: "/artists" },
  { label: "Listeners", to: "/listeners" },
  { label: "Partners", to: "/partners" },
  {
    label: "Library",
    to: "/governance",
    children: [
      { to: "/governance", label: "Library home" },
      { to: "/papers", label: "Papers" },
      { to: "/policies", label: "Policies" },
      { to: "/faqs", label: "FAQs" },
      { to: "/blog", label: "Blog" },
    ],
  },
  {
    label: "Support",
    to: "/join",
    children: [
      { to: "/join", label: "Join the Pack" },
      { to: "/support", label: "Fundraising" },
      { to: "/ambassador", label: "Ambassadors" },
      { to: "/patron", label: "Patrons" },
      { to: "/contact", label: "Contact us" },
    ],
  },
];

const LINK_CLASS = "font-mono text-xs uppercase tracking-[0.2em] hover:text-yellow";

function NavGroup({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const active = item.children!.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`));

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`${LINK_CLASS} flex items-center gap-1.5 py-2 ${active ? "text-yellow" : ""}`}
      >
        {item.label}
        <span aria-hidden="true" className={`text-[0.6em] transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 min-w-[13rem] rounded-md border-2 border-paper/20 bg-ink p-2 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]">
          {item.children!.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              onClick={() => setOpen(false)}
              className="block rounded px-3 py-2 font-mono text-xs uppercase tracking-[0.15em] hover:bg-paper/10 hover:text-yellow"
              activeProps={{ className: "text-yellow" }}
            >
              {c.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const joinButton =
    JOIN_BUTTON[pathname] ?? (pathname.startsWith("/blog") ? JOIN_BUTTON["/blog"]! : "bg-ember text-paper");
  const logoColor =
    LOGO_COLOR[pathname] ?? (pathname.startsWith("/blog") ? LOGO_COLOR["/blog"]! : "text-ember");

  return (
    <header className="sticky top-0 z-50 bg-ink/95 text-paper backdrop-blur">
      <div className="page-wrap flex items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
          <PackLogo variant="full" title="pack music – home" className={`h-11 ${logoColor}`} />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV.map((item) =>
            item.children ? (
              <NavGroup key={item.label} item={item} />
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={LINK_CLASS}
                activeProps={{ className: "text-yellow" }}
              >
                {item.label}
              </Link>
            ),
          )}
          <Link
            to="/join"
            className={`press rounded-full ${joinButton} px-5 py-2 text-sm font-bold uppercase tracking-widest`}
          >
            Join the Pack
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-full bg-electric px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper md:hidden"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <nav className="max-h-[75vh] overflow-y-auto bg-ink px-5 py-4 text-paper md:hidden" aria-label="Mobile">
          <ul className="space-y-4">
            {NAV.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <>
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-paper/50">
                      {item.label}
                    </span>
                    <ul className="mt-2 space-y-2 border-l-2 border-paper/20 pl-4">
                      {item.children.map((c) => (
                        <li key={c.to}>
                          <Link
                            to={c.to}
                            onClick={() => setOpen(false)}
                            className="text-base font-bold uppercase tracking-widest"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="text-base font-bold uppercase tracking-widest"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            <li>
              <Link
                to="/join"
                onClick={() => setOpen(false)}
                className={`press inline-flex rounded-full ${joinButton} px-5 py-2 text-sm font-bold uppercase tracking-widest`}
              >
                Join the Pack
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}



function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SiteTextProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
      </div>
      </SiteTextProvider>
    </QueryClientProvider>
  );
}
