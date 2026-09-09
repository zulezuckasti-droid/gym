import { AUTH_HEADER } from "@/lib/auth/constants";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function withAuthHeader(
  request: NextRequest,
  source: NextResponse,
  authenticated: boolean,
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(AUTH_HEADER, authenticated ? "1" : "0");
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  source.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  source.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    response.headers.set(key, value);
  });

  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return withAuthHeader(request, supabaseResponse, Boolean(user));
}
