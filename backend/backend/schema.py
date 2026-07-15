def assign_api_tags(result, generator, request, public):
    """Assign every operation to one documented API family."""
    for path, path_item in result.get("paths", {}).items():
        if path.startswith("/health/") or path == "/health/":
            tag = "Health"
        elif path.startswith("/api/auth/"):
            tag = "Authentication"
        elif path.startswith("/api/mls/estate-projects/"):
            tag = "Estate Projects"
        elif path.startswith("/api/mls/estate-documents/"):
            tag = "Estate Documents"
        elif path.startswith("/api/mls/estate-properties/"):
            tag = "Estate Properties (Legacy)"
        elif path.startswith("/api/mls/valuation/"):
            tag = "Valuation"
        elif path.startswith("/api/mls/inquiries/") or path.startswith("/api/mls/feedback/"):
            tag = "Inquiries"
        elif path.startswith("/api/mls/watched/alerts/"):
            tag = "Alerts"
        elif path.startswith("/api/mls/watched/"):
            tag = "Watched Properties"
        elif path.startswith("/api/mls/listing-") or path.startswith("/api/mls/property-notes/"):
            tag = "User Activity"
        elif path.startswith("/api/mls/nearest-school/") or path.startswith("/api/mls/nearby-amenities/") or path.startswith("/api/mls/census/") or path.startswith("/api/mls/properties/map-aggregates/"):
            tag = "Maps"
        elif path.startswith("/api/mls/properties/filter/"):
            tag = "Property Search"
        elif path.startswith("/api/mls/"):
            tag = "MLS Properties"
        elif path.startswith("/api/vlog/"):
            tag = "Vlogs"
        else:
            continue

        for method, operation in path_item.items():
            if method.lower() in {"get", "post", "put", "patch", "delete"}:
                operation["tags"] = [tag]
    return result
