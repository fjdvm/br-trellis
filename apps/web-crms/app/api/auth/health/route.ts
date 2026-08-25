import { NextResponse } from "next/server";

const AUTH_ISSUER = process.env.AUTH_ISSUER ?? "";

/**
 * Health check endpoint that probes the auth service OIDC discovery.
 * Used by the auth-unavailable page to know when the service is back.
 */
export async function GET() {
  if (!AUTH_ISSUER) {
    return NextResponse.json(
      { status: "error", message: "AUTH_ISSUER not configured" },
      { status: 503 }
    );
  }

  try {
    const discoveryUrl = `${AUTH_ISSUER}.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (response.ok) {
      return NextResponse.json({ status: "ok" });
    }

    return NextResponse.json(
      { status: "error", message: `Auth service responded with ${response.status}` },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Auth service unreachable" },
      { status: 503 }
    );
  }
}
