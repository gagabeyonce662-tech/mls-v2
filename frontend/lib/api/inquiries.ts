import { API_BASE_URL, fetchAPI } from "./client";
import { PropertyInquiryPayload } from "./types";

export async function submitPropertyInquiry(
  payload: PropertyInquiryPayload,
): Promise<{ id: number; message: string }> {
  const url = `${API_BASE_URL}/api/mls/inquiries/`;
  return fetchAPI<{ id: number; message: string }>(url, {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}
