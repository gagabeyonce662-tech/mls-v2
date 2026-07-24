from mls.services.ddf.converters import (
    safe_date,
    safe_str,
    safe_time,
)


def map_open_house_defaults(data):
    """
    Convert one raw DDF OpenHouse dictionary into values
    understood by the Django OpenHouse model.

    This function does not save anything to the database.
    """
    return {
        "listing_id": safe_str(data.get("ListingId")),
        "date": safe_date(data.get("OpenHouseDate")),
        "start_time": safe_time(data.get("OpenHouseStartTime")),
        "end_time": safe_time(data.get("OpenHouseEndTime")),
        "remarks": safe_str(data.get("OpenHouseRemarks")),
        "open_house_type": safe_str(data.get("OpenHouseType")),
        "status": safe_str(data.get("OpenHouseStatus")),
        "livestream_url": safe_str(
            data.get("LivestreamOpenHouseURL")
        ),
    }