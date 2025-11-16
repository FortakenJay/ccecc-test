import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Create next-intl middleware instance
const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // --- 1. Run next-intl first (handles locale redirects, etc.)
  const intlResponse = intlMiddleware(request);
  if (intlResponse) return intlResponse;

  // --- 2. Then update Supabase session
  return await updateSession(request);
}

// --- Unified Proxy-Friendly Matcher ---
export const config = {
  matcher: [
    // Match everything EXCEPT:
    // - API routes
    // - next internal files
    // - static/image assets
    // - vercel internals
    // - any file with extension (favicon, images, etc.)
    "/((?!api|trpc|_next|_vercel|_next/static|_next/image|.*\\..*).*)",
  ],
};
