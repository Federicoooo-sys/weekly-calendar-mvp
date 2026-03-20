import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Auth callback route — handles Supabase email confirmation redirects.
 * When a user clicks the email confirmation link, Supabase redirects here
 * with a `code` query param. We exchange it for a session and redirect to home.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore — can't set cookies in Server Components,
              // but the session will be picked up on the client.
            }
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to home page after confirmation
  return NextResponse.redirect(origin);
}
