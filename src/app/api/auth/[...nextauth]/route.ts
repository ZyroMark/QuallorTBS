// next-auth has been removed. Auth is handled via localStorage in AuthContext.
// This file is kept as a placeholder to prevent route conflicts.
export async function GET() {
    return new Response(JSON.stringify({ message: "Auth is handled client-side" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST() {
    return new Response(JSON.stringify({ message: "Auth is handled client-side" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
