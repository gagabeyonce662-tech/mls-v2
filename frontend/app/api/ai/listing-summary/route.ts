import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const apiBaseUrl = env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_API_URL is not configured.",
        },
        { status: 500 },
      );
    }

    const body = await req.json();
    const listingKey = String(body?.listing_key || "").trim();
    if (!listingKey) {
      return NextResponse.json(
        { error: "listing_key (or PropertyKey) is required." },
        { status: 400 },
      );
    }
    const authorization = req.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json({ error: "Sign in to generate a summary." }, { status: 401 });
    }

    const response = await fetch(
      `${apiBaseUrl}/api/mls/properties/ai-summary/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify({
          listing_key: listingKey,
          force: body?.force === true,
        }),
      },
    );

    const json = await response.json();
    if (!response.ok) {
      const message = json?.error || "Backend summary request failed.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(json);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected error generating summary." },
      { status: 500 },
    );
  }
}
