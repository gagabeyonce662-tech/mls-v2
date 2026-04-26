import { API_BASE_URL, fetchAPI } from "./client";

/**
 * Perform login with email and password
 */
export async function apiLogin(data: any) {
  const url = `${API_BASE_URL}/api/auth/login/`;
  return fetchAPI<any>(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Register a new user
 */
export async function apiRegister(data: any) {
  const url = `${API_BASE_URL}/api/auth/register/`;
  return fetchAPI<any>(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Authenticate with Google id_token
 */
export async function apiGoogleAuth(idToken: string) {
  const url = `${API_BASE_URL}/api/auth/google/`;
  return fetchAPI<any>(url, {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

/**
 * Authenticate with Google OAuth authorization code
 */
export async function apiGoogleAuthCode(code: string) {
  const url = `${API_BASE_URL}/api/auth/google/`;
  return fetchAPI<any>(url, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

/**
 * Refresh JWT access token
 */
export async function apiRefreshToken(refresh: string) {
  const url = `${API_BASE_URL}/api/auth/token/refresh/`;
  return fetchAPI<any>(url, {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

/**
 * Fetch current user profile
 */
export async function apiGetProfile() {
  const url = `${API_BASE_URL}/api/auth/profile/`;
  return fetchAPI<any>(url, {
    method: "GET",
  });
}
