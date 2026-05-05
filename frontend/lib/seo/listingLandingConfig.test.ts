import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  getAllListingLandings,
  getListingLandingBySlug,
  validateListingLandingConfig,
} from "./listingLandingConfig.ts";

describe("listingLandingConfig", () => {
  it("has unique valid entries", () => {
    const entries = getAllListingLandings();
    const issues = validateListingLandingConfig(entries);
    assert.equal(issues.length, 0);
  });

  it("resolves known slug and preserves deterministic filters", () => {
    const detached = getListingLandingBySlug("detached-homes-under-1m");
    assert.ok(detached);
    assert.equal(detached?.filters.property_type, "Detached");
    assert.equal(detached?.filters.price_max, 1000000);
  });

  it("marks POS and distress as provisional keyword logic in phase one", () => {
    const pos = getListingLandingBySlug("power-of-sale-properties");
    const distress = getListingLandingBySlug("distress-sale-homes");
    assert.equal(pos?.provisionalLogic, true);
    assert.equal(distress?.provisionalLogic, true);
    assert.ok(pos?.filters.keywords?.includes("power of sale"));
    assert.ok(distress?.filters.keywords?.includes("distress"));
  });
});
