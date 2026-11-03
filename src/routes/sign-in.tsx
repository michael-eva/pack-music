import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { PackLogo } from "@/components/site/PackLogo";
import { SignInForm } from "@/components/app/SignInForm";
import { getMe } from "@/lib/session.functions";
import { homeFor } from "@/lib/home-route";

export const Route = createFileRoute("/sign-in")({
  ssr: false,
  validateSearch: z.object({ next: z.string().startsWith("/").optional() }),
  head: () => ({ meta: [{ title: "Sign in · The Pack" }, { name: "robots", content: "noindex" }] }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  return (
    <div className="wave-field grad-deep-blue flex min-h-screen items-center justify-center px-5 py-16 text-paper">
      <div className="w-full max-w-md">
        <PackLogo variant="full" className="mx-auto block h-20 text-yellow" />
        <div className="mt-8 rounded-3xl border-2 border-ink bg-paper p-7 text-ink shadow-[6px_6px_0_0_var(--ink)]">
          <h1 className="text-3xl">Sign in or join</h1>
          <p className="mt-2 text-sm text-ink/70">
            New or returning, all we ask for is your email. Use a link or a password.
          </p>
          <div className="mt-6">
            <SignInForm
              redirectTo={next ?? "/"}
              onSignedIn={async () => {
                if (next) return navigate({ to: next });
                const me = await getMe();
                navigate({ to: homeFor(me.roles) });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
