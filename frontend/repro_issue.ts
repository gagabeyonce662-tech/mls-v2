import {
  fetchNewlyListedProperties,
  fetchPropertyByKey,
} from "./lib/api/properties";
import { API_BASE_URL } from "./lib/api/client";

async function run() {
  console.log("Base URL:", API_BASE_URL);

  // 1. Fetch new listings
  console.log("\n--- Fetching New Listings ---");
  const newListings = await fetchNewlyListedProperties({ limit: 1 });
  if (newListings.results.length === 0) {
    console.log("No new listings found.");
  } else {
    const first = newListings.results[0];
    console.log("First listing:", JSON.stringify(first, null, 2));

    // Try to determine the key
    const key =
      first.listing_key ||
      first.listingKey ||
      first.ListingKey ||
      first.PropertyKey ||
      first.id;
    console.log(`\nDerived Key from first listing: ${key}`);

    if (key) {
      // 2. Fetch by this key
      console.log(`\n--- Fetching by Derived Key: ${key} ---`);
      const details = await fetchPropertyByKey(key);
      if (details) {
        console.log("Success! Found details for key:", key);
      } else {
        console.error("Failed to fetch details for key:", key);
      }
    }
  }

  // 3. Test specific ID
  const specificId = "29164992";
  console.log(`\n--- Fetching by Specific ID: ${specificId} ---`);
  const specificDetails = await fetchPropertyByKey(specificId);
  if (specificDetails) {
    console.log("Success! Found details for specific ID:", specificId);
  } else {
    console.error("Failed to fetch details for specific ID:", specificId);
  }
}

run().catch(console.error);
