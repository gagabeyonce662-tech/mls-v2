import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  getEstateProjectLocation,
  getEstateProjectFacts,
  getEstateProjectPriceLabel,
  getEstateProjectUrl,
} from "./estate";

describe("estate project display helpers", () => {
  it("builds a detail URL from a slug", () => {
    assert.equal(
      getEstateProjectUrl({ id: 12, slug: "my-project" }),
      "/pre-construction/my-project",
    );
  });

  it("falls back to the numeric ID when the slug is missing", () => {
    assert.equal(
      getEstateProjectUrl({ id: 12, slug: null }),
      "/pre-construction/12",
    );
  });

  it("joins available location fields and reports a fully missing address", () => {
    assert.equal(
      getEstateProjectLocation({ address: "10 King St", city: "Toronto", province: "ON" }),
      "10 King St, Toronto, ON",
    );
    assert.equal(
      getEstateProjectLocation({ address: null, city: null, province: null }),
      "Address unavailable",
    );
  });

  it("uses real price text and reports missing pricing honestly", () => {
    assert.equal(
      getEstateProjectPriceLabel({ lowest_price_display: "From $500,000" }),
      "From $500,000",
    );
    assert.equal(
      getEstateProjectPriceLabel({ lowest_price_display: null }),
      "Contact for pricing",
    );
  });

  it("omits missing developer and occupancy facts", () => {
    assert.deepEqual(
      getEstateProjectFacts({ developer: null, occupancy_year: null }),
      [],
    );
    assert.deepEqual(
      getEstateProjectFacts({ developer: "Example Homes", occupancy_year: 2028 }),
      [
        { label: "Developer", value: "Example Homes" },
        { label: "Occupancy", value: "2028" },
      ],
    );
  });
});
