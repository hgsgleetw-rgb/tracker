import { NextRequest, NextResponse } from "next/server";

// Google Sign-In redirect (ux_mode: "redirect") posts the credential here as
// a top-level form POST. We stash it in a short-lived, readable cookie and
// bounce back to the app, where the client picks it up and signs in. This
// avoids the popup flow that hangs on accounts.google.com/gsi/transform on
// mobile browsers.
export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;
  let credential = "";
  let bodyCsrf = "";
  try {
    const form = await req.formData();
    credential = String(form.get("credential") ?? "");
    bodyCsrf = String(form.get("g_csrf_token") ?? "");
  } catch {
    /* fall through to error redirect */
  }

  if (!credential) {
    return NextResponse.redirect(new URL("/?gerror=missing", origin), 303);
  }

  // Double-submit CSRF check: the body token must match the cookie token.
  const cookieCsrf = req.cookies.get("g_csrf_token")?.value ?? "";
  if (bodyCsrf && cookieCsrf && bodyCsrf !== cookieCsrf) {
    return NextResponse.redirect(new URL("/?gerror=csrf", origin), 303);
  }

  const res = NextResponse.redirect(new URL("/", origin), 303);
  // Readable by client JS on the next load; short TTL since it's one-time use.
  res.cookies.set("g_cred", credential, {
    path: "/",
    maxAge: 120,
    sameSite: "lax",
    httpOnly: false,
    secure: true,
  });
  return res;
}
