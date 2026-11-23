import * as React from "react";

// SweatShop feedback widget (github.com/michael-eva/SweatShop). Loaded in the
// browser only (it screenshots the page), and renders nothing until both env
// vars are set, so a missing key can never break a page.
const FeedbackWidget = React.lazy(() =>
  import("@michael-eva/sweatshop-react-widget").then((m) => ({ default: m.FeedbackWidget })),
);

export function Feedback() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const convexUrl = import.meta.env["VITE_SWEATSHOP_CONVEX_URL"] as string | undefined;
  const publicKey = import.meta.env["VITE_SWEATSHOP_PUBLIC_KEY"] as string | undefined;
  if (!mounted || !convexUrl || !publicKey) return null;

  return (
    <React.Suspense fallback={null}>
      <FeedbackWidget
        convexUrl={convexUrl}
        publicKey={publicKey}
        buttonLabel="Feedback"
        theme={{
          primary: "oklch(0.48 0.31 267)",
          primaryText: "#ffffff",
          text: "oklch(0.13 0.02 285)",
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        }}
      />
    </React.Suspense>
  );
}
