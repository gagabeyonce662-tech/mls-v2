import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { mergeHomepageCategories } from "./categories";
import type { HomepageCategory } from "@/lib/api/types";

describe("mergeHomepageCategories", () => {
  it("keeps core categories with deterministic order", () => {
    const input: HomepageCategory[] = [
      {
        key: "rental",
        kind: "rental",
        label: "Rental",
        count: 10,
        enabled: true,
        route: "/listing/rental",
        source: "backend",
        order: 300,
      },
      {
        key: "exclusive",
        kind: "exclusive",
        label: "Exclusive",
        count: 10,
        enabled: true,
        route: "/listing",
        source: "backend",
        order: 200,
      },
    ];

    const merged = mergeHomepageCategories(input, { minCountThreshold: 5 });
    assert.equal(merged[0]?.key, "exclusive");
    assert.equal(merged[1]?.key, "rental");
  });

  it("filters unknown categories from backend", () => {
    const input: HomepageCategory[] = [
      {
        key: "property_type:unknown-future-type",
        kind: "property_type",
        label: "Unknown",
        count: 100,
        enabled: true,
        route: "/listing",
        source: "backend",
        order: 1,
      },
    ];

    const merged = mergeHomepageCategories(input);
    assert.equal(
      merged.some((item) => item.key === "property_type:unknown-future-type"),
      false,
    );
  });

  it("preserves optional query semantics for core categories", () => {
    const input: HomepageCategory[] = [
      {
        key: "exclusive",
        kind: "exclusive",
        label: "Exclusive",
        count: 5,
        enabled: true,
        route: "/listing",
        source: "backend",
        order: 50,
      },
    ];

    const merged = mergeHomepageCategories(input);
    const exclusive = merged.find((item) => item.key === "exclusive");

    assert.ok(exclusive);
    assert.equal("query" in exclusive, false);
  });

  it("keeps community category as core section", () => {
    const input: HomepageCategory[] = [
      {
        key: "community",
        kind: "community",
        label: "Community",
        count: 2,
        enabled: true,
        route: "/community-listings",
        source: "backend",
        order: 250,
      },
    ];

    const merged = mergeHomepageCategories(input);
    const community = merged.find((item) => item.key === "community");
    assert.ok(community);
    assert.equal(community?.route, "/community-listings");
  });
});
