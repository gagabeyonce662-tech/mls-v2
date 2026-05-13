import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  normalizeEstateDetailRecord,
  normalizeListingRecord,
} from "./listingNormalizer.ts";

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

  it("maps estate detail records into card/detail-friendly canonical fields", () => {
    const normalized = normalizeEstateDetailRecord(
      {
        id: 42,
        property_title: "Harbor Heights",
        publish_status: "published",
        city: "Mississauga",
        property_description: "<p>Modern waterfront homes</p>",
        featured_image_url:
          "https://estate-4u.com/wp-content/uploads/2026/06/harbor-heights.webp",
        list_price: "1499000",
      },
      "42",
    );

    assert.equal(normalized.listing_key, "estate_42");
    assert.equal(normalized.StandardStatus, "published");
    assert.equal(normalized.project_name, "Harbor Heights");
    assert.equal(normalized.property_title, "Harbor Heights");
    assert.equal(normalized.City, "Mississauga");
    assert.equal(normalized.PublicRemarks, "Modern waterfront homes");
    assert.equal(normalized.ListPrice, 1499000);
    assert.equal(normalized.media?.[0]?.media_url, "https://estate-4u.com/wp-content/uploads/2026/06/harbor-heights.webp");
  });

  it("unwraps wp_meta_json array values for estate detail fields", () => {
    const normalized = normalizeEstateDetailRecord(
      {
        id: 12,
        publish_status: "published",
        wp_meta_json: {
          fave_property_city: ["Toronto"],
          fave_property_state: ["ON"],
          fave_property_address: ["123 Test Ave"],
          fave_property_zip: ["M5V 2T6"],
          fave_property_price: ["1450000"],
          fave_property_bedrooms: ["3"],
          fave_property_bathrooms: ["2"],
          fave_property_size: ["1800"],
          fave_property_lot_size: ["25x90"],
          fave_taxes: ["3400"],
          "fave_tax-year": ["2025"],
          houzez_geolocation_lat: ["43.6426"],
          houzez_geolocation_long: ["-79.3871"],
        },
      },
      "12",
    );

    assert.equal(normalized.listing_key, "estate_12");
    assert.equal(normalized.City, "Toronto");
    assert.equal(normalized.StateOrProvince, "ON");
    assert.equal(normalized.unparsed_address, "123 Test Ave");
    assert.equal(normalized.postal_code, "M5V 2T6");
    assert.equal(normalized.ListPrice, 1450000);
    assert.equal(normalized.BedroomsTotal, 3);
    assert.equal(normalized.BathroomsTotalInteger, 2);
    assert.equal(normalized.building_area_total, 1800);
    assert.equal(normalized.lot_size_dimensions, "25x90");
    assert.equal(normalized.tax_annual_amount, "3400");
    assert.equal(normalized.tax_year, "2025");
    assert.equal(normalized.latitude, "43.6426");
    assert.equal(normalized.longitude, "-79.3871");
  });

  it("does not fallback estate detail fields to pre-construction labels", () => {
    const normalized = normalizeEstateDetailRecord(
      {
        id: 77,
        list_price: "2000000",
      },
      "77",
    );

    assert.equal(normalized.City, "Unknown City");
    assert.equal(normalized.PropertySubType, "Property");
    assert.equal(normalized.StandardStatus, "For Sale");
  });

  it("keeps province, postal, and title aliases from estate records", () => {
    const normalized = normalizeEstateDetailRecord(
      {
        id: 10,
        province: "ON",
        PostalCode: "M5V 2T6",
        state_or_province: "",
        location: "Toronto",
        property_title: "VIVEK JOSHI HOUSE 3",
        ListPrice: "2000000",
        BedroomsTotal: "4",
        BathroomsTotalInteger: "3",
        PublicRemarks: "Sample remarks",
      },
      "10",
    );

    assert.equal(normalized.project_name, "VIVEK JOSHI HOUSE 3");
    assert.equal(normalized.property_title, "VIVEK JOSHI HOUSE 3");
    assert.equal(normalized.state_or_province, "ON");
    assert.equal(normalized.StateOrProvince, "ON");
    assert.equal(normalized.province, "ON");
    assert.equal(normalized.postal_code, "M5V 2T6");
    assert.equal(normalized.PostalCode, "M5V 2T6");
    assert.equal(normalized.city, "Toronto");
    assert.equal(normalized.City, "Toronto");
    assert.equal(normalized.ListPrice, 2000000);
    assert.equal(normalized.BedroomsTotal, 4);
    assert.equal(normalized.BathroomsTotalInteger, 3);
    assert.equal(normalized.PublicRemarks, "Sample remarks");
  });
});
