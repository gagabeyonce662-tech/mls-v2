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
 * Perform staff-only admin login with email and password
 */
export async function apiAdminLogin(data: { email: string; password: string }) {
  const url = `${API_BASE_URL}/api/auth/admin/login/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const raw = await res.text();
    throw new Error(`ADMIN_LOGIN_ERROR:${res.status}:${raw}`);
  }

  return res.json();
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
 * Authenticate with Facebook OAuth authorization code
 */
export async function apiFacebookAuthCode(code: string, redirectUri?: string) {
  const url = `${API_BASE_URL}/api/auth/facebook/`;
  const body: { code: string; redirect_uri?: string } = { code };
  if (redirectUri) {
    body.redirect_uri = redirectUri;
  }
  return fetchAPI<any>(url, {
    method: "POST",
    body: JSON.stringify(body),
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
