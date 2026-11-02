import { Link } from "@tanstack/react-router";
import { PackLogo } from "./PackLogo";

const NAV = [
  { to: "/artists", label: "Artists" },
  { to: "/listeners", label: "Listeners" },
  { to: "/partners", label: "Partners" },
  { to: "/about", label: "About" },
  { to: "/story", label: "Our story" },
  { to: "/coop-model", label: "Co-op model" },
  { to: "/board", label: "Board" },
] as const;

/** Scribbled divider line drawn with a marker feel. */
function ScribbleDivider({ dark = true }: { dark?: boolean }) {
  const color = dark ? "var(--paper)" : "var(--ink)";
  return (
    <div className="pointer-events-none absolute -top-4 left-0 right-0 h-8 overflow-visible" aria-hidden="true">
      <svg
        className="h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 1200 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,18 C60,12 120,22 180,17 C240,12 300,20 360,16 C420,12 480,22 540,17 C600,13 660,21 720,16 C780,11 840,23 900,17 C960,12 1020,20 1080,15 C1140,10 1200,20 1200,18"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M0,22 C50,28 110,14 170,21 C230,28 290,15 350,22 C410,29 470,16 530,23 C590,30 650,17 710,24 C770,31 830,18 890,25 C950,32 1010,19 1070,26 C1130,33 1200,20 1200,22"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}

export function Footer({ dark = true }: { dark?: boolean }) {
  const text = dark ? "text-paper" : "text-ink";
  const muted = dark ? "text-paper/70" : "text-ink/70";
  const border = dark ? "border-paper/20" : "border-ink/15";
  const accent = dark ? "text-yellow" : "text-electric";
  const hover = dark ? "hover:text-yellow" : "hover:text-electric";
  


  return (
    <footer className={`relative pt-12 ${text}`}>
      <ScribbleDivider dark={dark} />
      <div className="page-wrap grid gap-8 px-5 py-12 sm:grid-cols-2">
        <div>
          <PackLogo variant="full" className={`mb-6 h-20 ${text}`} />
          <p className="font-display text-3xl leading-none">
            Streaming that pays
            <br />
            <span className={accent}>musicians first.</span>
          </p>
          <p className={`mt-4 max-w-sm text-sm ${muted}`}>
            A registered co-operative, owned by its members. One member, one vote.
          </p>
        </div>
        <div className="sm:justify-self-end">
          <ul className="space-y-2 text-sm font-bold uppercase tracking-widest">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={hover}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/support" className={hover}>
                Support the campaign
              </Link>
            </li>
            <li>
              <Link to="/ambassador" className={hover}>
                Ambassadors
              </Link>
            </li>
            <li>
              <Link to="/patron" className={hover}>
                Patrons
              </Link>
            </li>
            <li>
              <Link to="/contact" className={hover}>
                Contact us
              </Link>
            </li>
            <li>
              <Link to="/join" className={`${accent} hover:underline`}>
                Join the Pack
              </Link>
            </li>

          </ul>
        </div>
      </div>
      <div className={`border-t ${border} px-5 py-5 text-center text-xs font-bold uppercase tracking-widest ${dark ? "text-paper/90" : "text-ink/90"}`}>
        The Pack Music Co-operative. Made on Whadjuk Noongar Boodja
        <Link to="/auth" className="ml-3 opacity-40 hover:opacity-100 hover:underline">
          Staff login
        </Link>
      </div>
    </footer>
  );
}
