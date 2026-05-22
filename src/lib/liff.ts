import type Liff from "@line/liff";

let liffInstance: typeof Liff | null = null;

export async function initLiff(): Promise<typeof Liff> {
  if (liffInstance) return liffInstance;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) throw new Error("NEXT_PUBLIC_LIFF_ID is not set");

  const liff = (await import("@line/liff")).default;
  await liff.init({ liffId });
  liffInstance = liff;
  return liff;
}

export async function getLiffProfile() {
  const liff = await initLiff();
  if (!liff.isLoggedIn()) {
    liff.login();
    // login() redirects, so we never reach here
    throw new Error("Redirecting to LINE login");
  }
  return liff.getProfile();
}
