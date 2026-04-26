import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_API_URL is not configured.",
        },
        { status: 500 },
      );
    }

    const body = await req.json();
    const property = body?.property;
    if (!property || typeof property !== "object") {
      return NextResponse.json(
        { error: "Missing property payload." },
        { status: 400 },
      );
    }
    const listingKey = String(
      property.listing_key || property.PropertyKey || property.id || "",
    ).trim();
    if (!listingKey) {
      return NextResponse.json(
        { error: "listing_key (or PropertyKey) is required." },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${apiBaseUrl}/api/mls/properties/ai-summary/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_key: listingKey,
          property,
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
