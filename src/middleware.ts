import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/admin", "/api/projects", "/api/upload", "/api/generate", "/api/style"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "change-this-password";
  const authorization = request.headers.get("authorization");

  if (authorization) {
    const [scheme, encoded] = authorization.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const separator = decoded.indexOf(":");
      const inputUser = decoded.slice(0, separator);
      const inputPassword = decoded.slice(separator + 1);
      if (inputUser === username && inputPassword === password) return NextResponse.next();
    }
  }

  return new NextResponse("需要登录管理后台", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI Panorama Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/projects/:path*", "/api/upload/:path*", "/api/generate/:path*", "/api/style/:path*"],
};
