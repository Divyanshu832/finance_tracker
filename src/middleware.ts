import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

// Edge-safe verify: re-implement HMAC check without the Node `cookies()` helper.
function verify(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = crypto.createHmac("sha256", secret).update(`v1.${expStr}`).digest("hex");
  if (expected.length !== sig.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }
  const token = req.cookies.get("munim_session")?.value;
  const secret = process.env.SESSION_SECRET || "";
  if (!verify(token, secret)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Node runtime so we can use node:crypto for HMAC.
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js)).*)"],
};
