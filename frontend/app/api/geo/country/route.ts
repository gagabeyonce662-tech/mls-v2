import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isCountryCode(value: string | null): value is string {
  return Boolean(value && /^[A-Z]{2}$/.test(value));
}

export async function GET(request: Request) {
  const headers = request.headers;
  const edgeCountry =
    headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry");

  if (isCountryCode(edgeCountry)) {
    return NextResponse.json(
      { countryCode: edgeCountry },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    // During local development there is no Vercel country header. This request
    // is made server-side, so the browser does not send its IP to ipwho.is.
    const response = await fetch("https://ipwho.is/", {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    const data = (await response.json()) as {
      success?: boolean;
      country_code?: string;
    };
    const countryCode = data.country_code?.trim().toUpperCase() || "";

    if (data.success && isCountryCode(countryCode)) {
      return NextResponse.json(
        { countryCode },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
  } catch {
    // Country detection is optional; the client falls back to browser signals.
  }

  return NextResponse.json(
    { countryCode: null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
