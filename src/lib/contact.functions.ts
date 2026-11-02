import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255),
  message: z.string().trim().min(1, "Say something").max(4000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      message: data.message,
    });

    if (error) {
      console.error("[contact] insert failed", error.message);
      return { status: "error" as const };
    }

    return { status: "ok" as const };
  });
