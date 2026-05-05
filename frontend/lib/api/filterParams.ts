export function buildFilterSearchParams(
  filters: Record<string, unknown>,
): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;
    const queryKey = key === "property_sub_type" ? "property_type" : key;
    if (Array.isArray(value)) {
      const cleaned = value
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
      if (cleaned.length > 0) {
        params.append(queryKey, cleaned.join(","));
      }
      return;
    }
    if (typeof value === "boolean") {
      if (value) params.append(queryKey, "true");
    } else {
      params.append(queryKey, String(value));
    }
  });
  return params;
}
