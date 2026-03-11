/**
 * Returns Authorization header using the stored DRF token.
 * Pass json=false for FormData requests (browser sets Content-Type + boundary).
 */
export function getAuthHeaders(json = true): Record<string, string> {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

/**
 * Call after a non-ok response. Clears auth and redirects to /login on 401.
 */
export function handleAuthError(res: Response): void {
  if (res.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUserId");
    localStorage.removeItem("authEmail");
    window.location.replace("/login");
  }
}
