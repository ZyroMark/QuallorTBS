"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The browser Supabase client.
 *
 * This runs with the publishable (anon) key and therefore with the caller's own
 * permissions: every table is behind row level security, so a signed-out
 * visitor reads nothing and a signed-in one reads only their own slice. See
 * supabase/migrations/0002_rls_policies.sql for what each role can reach.
 *
 * Safe to call repeatedly; the underlying client is memoised per tab.
 */
// Typed as SupabaseClient rather than ReturnType<typeof createBrowserClient>:
// that helper is generic, so ReturnType resolves its parameters away and every
// call downstream degrades to `any`.
let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
    if (client) return client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error(
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
                "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server."
        );
    }

    client = createBrowserClient(url, key);
    return client;
}

/** True when the environment has both public Supabase values set. */
export function isSupabaseConfigured(): boolean {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}
