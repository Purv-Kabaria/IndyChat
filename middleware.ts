import { NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/verify",
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/reset-password",
  "/chat"
];

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = {
  "api/auth": 10,
  api: 60,
  default: 100,
};

const rateLimitStore: Record<string, { count: number; timestamp: number }> = {};

setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (now - rateLimitStore[key].timestamp > RATE_LIMIT_WINDOW) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;"
  );

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
  const rateLimitKey = getRateLimitKey(pathname, clientIp);

  if (!applyRateLimit(rateLimitKey, pathname)) {
    return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    });
  }

  if (isPublicRoute(pathname)) {
    return response;
  }

  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    if (!pathname.startsWith("/api/")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("return_to", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return response;
}

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css")
  ) {
    return true;
  }

  if (
    pathname.startsWith("/api/auth/") ||
    pathname.includes("oobCode=") ||
    pathname.includes("mode=") ||
    pathname.includes("apiKey=") ||
    pathname.includes("continueUrl=")
  ) {
    return true;
  }

  return false;
}

function getRateLimitKey(pathname: string, ip: string): string {
  if (pathname.startsWith("/api/auth/")) {
    return `auth:${ip}`;
  } else if (pathname.startsWith("/api/")) {
    return `api:${ip}`;
  }
  return `default:${ip}`;
}

function applyRateLimit(key: string, pathname: string): boolean {
  const now = Date.now();

  let limit = MAX_REQUESTS_PER_WINDOW.default;
  if (pathname.startsWith("/api/auth/")) {
    limit = MAX_REQUESTS_PER_WINDOW["api/auth"];
  } else if (pathname.startsWith("/api/")) {
    limit = MAX_REQUESTS_PER_WINDOW.api;
  }

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 1, timestamp: now };
    return true;
  }

  const entry = rateLimitStore[key];

  if (now - entry.timestamp > RATE_LIMIT_WINDOW) {
    entry.count = 1;
    entry.timestamp = now;
    return true;
  }

  entry.count++;
  return entry.count <= limit;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
