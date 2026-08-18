import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every navigation.
 *
 * Access tokens are short lived. Without this the refresh only happens in the
 * browser, so a server-rendered page can see an expired token and treat a
 * signed-in user as anonymous, which RLS then correctly refuses. Calling
 * getUser() here rotates the token and writes the new cookies onto the
 * response.
 */
export async function middleware(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Without configuration there is no session to refresh. Fail open rather
    // than throwing on every single request.
    if (!url || !key) return NextResponse.next({ request });

    let response = NextResponse.next({ request });

    const supabase = createServerClient(url, key, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                );
            },
        },
    });

    // Must be getUser(), not getSession(): only getUser() revalidates the token
    // with the auth server, and only that triggers the refresh.
    await supabase.auth.getUser();

    return response;
}

export const config = {
    matcher: [
        /*
         * Everything except static assets and image files. Running on those
         * would refresh the session dozens of times per page load.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
