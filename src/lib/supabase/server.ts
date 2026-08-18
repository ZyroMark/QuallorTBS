import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * The server Supabase client, for server components, route handlers and server
 * actions. Still the publishable key, so row level security applies exactly as
 * it does in the browser: this is not an escape hatch.
 *
 * Must be created per request, never hoisted to a module-level constant, since
 * it closes over that request's cookies.
 */
export async function createClient() {
    const cookieStore = await cookies();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error(
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
                "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
        );
    }

    return createServerClient(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // Called from a server component, where cookies are read-only.
                    // Harmless as long as middleware refreshes the session.
                }
            },
        },
    });
}
