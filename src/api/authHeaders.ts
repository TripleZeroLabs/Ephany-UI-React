/**
 * Auth headers for API requests.
 *
 * The browser authenticates as a *user*, with a DRF token obtained by logging
 * in. It deliberately does not carry an API key.
 *
 * An earlier version fell back to `X-API-Key` from `VITE_API_KEY` when no token
 * was present. That could not work safely: Vite replaces `import.meta.env.*`
 * with literal strings at build time, so the key shipped inside the JS bundle
 * that every visitor downloads before logging in. It also bought nothing — the
 * fallback was unreachable, because every data-fetching route sits behind
 * ProtectedLayout, which redirects to /login when there is no token.
 *
 * API keys are for clients that can keep a secret: the Revit plugin, CLI
 * scripts, the Smartsheet sync commands. Not this.
 *
 * Pass json=false for FormData requests, so the browser can set Content-Type
 * with its own multipart boundary.
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
 * Call after any non-ok response.
 *
 * On 401 the stored token is missing, expired, or was revoked, so the session
 * is cleared and the user is sent to /login. Every API helper calls this, which
 * is what makes an expired token recoverable — without it the app sits on a
 * logged-in shell where every request fails and nothing offers a way out.
 *
 * 403 is deliberately not handled here. From this API it means a credential was
 * supplied but is not permitted, which clearing the session would not fix.
 */
export function handleAuthError(res: Response): void {
  if (res.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUserId");
    localStorage.removeItem("authEmail");
    window.location.replace("/login");
  }
}
