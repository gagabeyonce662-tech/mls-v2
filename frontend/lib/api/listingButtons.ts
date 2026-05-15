import { API_BASE_URL, fetchAPI } from "@/lib/api/client";

export type TrackEstateListingButtonClickPayload = {
  estatePropertyId?: string | number | null;
  listingKey: string;
  buttonId: string;
};

export type TrackEstateListingButtonClickResponse = {
  ok: boolean;
  href: string;
  button?: {
    id: string;
    label: string;
    requires_phone_verification?: boolean;
  };
};

export async function trackEstateListingButtonClick(
  payload: TrackEstateListingButtonClickPayload,
): Promise<TrackEstateListingButtonClickResponse> {
  return fetchAPI<TrackEstateListingButtonClickResponse>(
    `${API_BASE_URL}/api/mls/estate-properties/buttons/click/`,
    {
      method: "POST",
      body: JSON.stringify({
        estate_property_id: payload.estatePropertyId,
        listing_key: payload.listingKey,
        button_id: payload.buttonId,
      }),
    },
  );
}
