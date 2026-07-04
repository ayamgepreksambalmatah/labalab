import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes the session cookie so
 * `supabase.auth.getUser()` works on the server.
 *
 * Usage (spec §4):
 *   const supabase = await createServerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore because
            // session refresh is handled by middleware.
          }
        },
      },
    },
  );
}

/**
 * Privileged client using the service role key. BYPASSES Row Level
 * Security — only use in trusted server code (e.g. Midtrans webhook
 * updating another user's subscription). NEVER expose to the client.
 */
export function createServiceRoleClient() {
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no-op: service role client is stateless */
        },
      },
    },
  );
}
