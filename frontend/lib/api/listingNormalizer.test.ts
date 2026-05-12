import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { normalizeListingRecord } from "./listingNormalizer.ts";

describe("normalizeListingRecord", () => {
  it("coerces null-like fields to schema-safe values", () => {
    const normalized = normalizeListingRecord({
      id: 9,
      city: "Toronto",
      list_price: 1200000,
      total_actual_rent: null,
      rooms: null,
    });

    assert.equal(normalized.id, "9");
    assert.equal(normalized.total_actual_rent, undefined);
    assert.deepEqual(normalized.rooms, []);
    assert.deepEqual(normalized.Rooms, []);
  });

  it("extracts image names and keeps only configured remote hosts", () => {
    const normalized = normalizeListingRecord({
      id: 3,
      city: "Toronto",
      media: [
        {
          media_url:
            "https://imgs.search.brave.com/udTxVRziGBr8NGtRoLftUpy--2c1lnzqkMUTgJkdgrs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9oaXBzLmhlYXJzdGFwcHMuY29tL2hvdXNlLmpwZw==",
        },
        {
          media_url:
            "https://estate-4u.com/wp-content/uploads/2026/05/sample-home.jpg?ver=1",
        },
      ],
    });

    const media = normalized.media || [];
    assert.equal(media.length, 1);
    assert.equal(
      media[0].media_url,
      "https://estate-4u.com/wp-content/uploads/2026/05/sample-home.jpg?ver=1",
    );
    assert.equal((normalized as any).image_filename, "sample-home.jpg");
    assert.deepEqual((normalized as any).image_names, ["sample-home.jpg"]);
  });
});
