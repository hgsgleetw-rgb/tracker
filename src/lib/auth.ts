import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

// The numeric channel id is the prefix of the LIFF id ("2010086358-My5vp2Lh").
function expectedChannelId(): string | null {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return null;
  return liffId.split("-")[0] || null;
}

function bearer(request: Request): string | null {
  const h = request.headers.get("authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

type AuthResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

function unauthorized(msg: string): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error: msg }, { status: 401 }) };
}

/**
 * Verify the LINE access token sent by the client, confirm it was issued for
 * OUR channel, resolve the user's LINE profile, and upsert the User row.
 * Returns the authenticated user or an error response to return directly.
 */
export async function authenticate(request: Request): Promise<AuthResult> {
  const token = bearer(request);
  if (!token) return unauthorized("Missing access token");

  try {
    // 1) Verify the token is valid AND belongs to our channel.
    const verifyRes = await fetch(
      `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(token)}`
    );
    if (!verifyRes.ok) return unauthorized("Invalid access token");
    const verify = (await verifyRes.json()) as { client_id?: string; expires_in?: number };

    const channelId = expectedChannelId();
    if (channelId && verify.client_id !== channelId) {
      return unauthorized("Token issued for a different channel");
    }
    if (typeof verify.expires_in === "number" && verify.expires_in <= 0) {
      return unauthorized("Access token expired");
    }

    // 2) Resolve identity from the verified token.
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!profileRes.ok) return unauthorized("Could not resolve LINE profile");
    const profile = (await profileRes.json()) as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };
    if (!profile.userId) return unauthorized("LINE profile missing userId");

    // 3) Upsert the user — identity is now trusted.
    const user = await prisma.user.upsert({
      where: { lineUserId: profile.userId },
      update: {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl ?? null,
      },
      create: {
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl ?? null,
      },
    });

    return { ok: true, user };
  } catch (e) {
    console.error("[auth]", e);
    return { ok: false, response: NextResponse.json({ error: "Auth failed" }, { status: 500 }) };
  }
}
