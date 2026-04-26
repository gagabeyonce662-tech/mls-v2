import { API_BASE_URL, fetchAPI } from "./client";
import { FeedbackSubmissionPayload } from "./types";

export async function submitFeedback(
  payload: FeedbackSubmissionPayload,
): Promise<{ id: number; message: string }> {
  const url = `${API_BASE_URL}/api/mls/feedback/`;
  return fetchAPI<{ id: number; message: string }>(url, {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}
