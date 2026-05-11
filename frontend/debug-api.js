async function testApi() {
  const urls = [
    "http://127.0.0.1:8000/api/mls/properties/newly-listed-properties/?limit=6&offset=0",
    "https://mls-backend-v2.vercel.app/api/mls/properties/newly-listed-properties/?limit=6&offset=0",
  ];

  for (const url of urls) {
    console.log(`\nFetching from: ${url}`);
    try {
      const response = await fetch(url);
      console.log(`Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        const count = data.results
          ? data.results.length
          : Array.isArray(data)
            ? data.length
            : 0;
        console.log(`Success! Found ${count} properties.`);
      } else {
        console.log("Error text:", await response.text());
      }
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
  }
}

testApi();
