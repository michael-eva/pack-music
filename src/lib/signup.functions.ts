import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  name: z.string().trim().max(100).optional().or(z.literal("")),
  role: z.enum(["artist", "listener", "business", "council"]),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const submitSignup = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("signups").insert({
      email: data.email.toLowerCase(),
      name: data.name || null,
      role: data.role,
      location: data.location || null,
      message: data.message || null,
    });

    if (error) {
      if (error.code === "23505") {
        return { status: "duplicate" as const };
      }
      console.error("[signup] insert failed", error.message);
      return { status: "error" as const };
    }

    return { status: "ok" as const };
  });
