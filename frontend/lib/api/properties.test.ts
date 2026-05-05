import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { buildFilterSearchParams } from "./filterParams.ts";

describe("buildFilterSearchParams", () => {
  it("serializes array filters as comma-separated values", () => {
    const params = buildFilterSearchParams({
      status_group: ["active", "sold", "de-listed"],
    });
    assert.equal(params.get("status_group"), "active,sold,de-listed");
  });

  it("remaps property_sub_type and ignores false booleans", () => {
    const params = buildFilterSearchParams({
      property_sub_type: "Detached",
      has_lease: false,
      has_photos: true,
    });
    assert.equal(params.get("property_type"), "Detached");
    assert.equal(params.get("has_lease"), null);
    assert.equal(params.get("has_photos"), "true");
  });
});
