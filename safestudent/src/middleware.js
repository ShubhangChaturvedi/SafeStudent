import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "cf87ea72-9f91-4c73-a02f-c84502653faa");
  requestHeaders.set("x-createxyz-project-group-id", "48c12148-2c28-466d-8e17-735a4aee1b06");


  request.nextUrl.href = `https://www.createanything.com/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}