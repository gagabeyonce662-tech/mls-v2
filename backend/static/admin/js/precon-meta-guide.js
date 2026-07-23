(() => {
  const guide = {
    developer: "Builder/developer name, e.g. Empire Communities",
    occupancy_year: "Expected occupancy/completion year, e.g. 2028",
    property_types: "Comma-separated types, e.g. Townhomes, Detached Homes",
    price_display: "Marketing price, e.g. From $699,900",
    bedrooms_min: "Number, e.g. 2",
    bedrooms_max: "Number, e.g. 4",
    bathrooms_min: "Number, e.g. 2",
    bathrooms_max: "Number, e.g. 3",
    area_min: "Number, e.g. 1200",
    area_max: "Number, e.g. 2400",
    area_unit: "Text, e.g. sq. ft.",
    garage_count: "Number, e.g. 1",
    incentives: "Separate each item with |, e.g. Décor credit|Free assignment",
    amenities: "Separate each item with |, e.g. Parks nearby|Near GO",
    floor_plan_url: "A direct PDF or Google Drive floor-plan link",
    deposit_structure: "Separate steps with ;, e.g. $10K on signing;$10K in 30 days",
    deposit_plans_json: "JSON. See the project-field guide above for the required shape.",
    community_highlights_json: "JSON list, e.g. [\"Parks and trails\", \"Near transit\"]",
    interior_features_json: "JSON list, e.g. [\"9 ft ceilings\", \"Quartz counters\"]",
    exterior_features_json: "JSON list, e.g. [\"Private balcony\", \"Brick exterior\"]",
    nearby_places_json: "JSON list of {name, category, travel_time} objects.",
    buyer_information_json: "JSON list of {label, value} objects.",
    home_collections_json: "JSON list of collection objects. See the guide above.",
    purchase_notes_json: "JSON list, e.g. [\"Prices subject to change.\"]",
    seo_title: "SEO/browser title for the project page",
  };

  function update(keyInput) {
    const row = keyInput.closest("tr, .form-row, fieldset") || document;
    const valueInput = row.querySelector("textarea.precon-meta-value");
    if (!valueInput) return;
    valueInput.placeholder = guide[keyInput.value] || "Enter the value for this custom field";
  }

  function initialize() {
    document.querySelectorAll("input[data-precon-meta-key]").forEach((input) => {
      if (input.dataset.preconMetaGuideReady) return;
      input.dataset.preconMetaGuideReady = "true";
      input.addEventListener("input", () => update(input));
      input.addEventListener("change", () => update(input));
      update(input);
    });
  }

  document.addEventListener("DOMContentLoaded", initialize);
  new MutationObserver(initialize).observe(document.documentElement, { childList: true, subtree: true });
})();
