/**
 * Parse response body as JSON without throwing on empty or invalid body.
 * Use when the API might return empty body (e.g. 204, or error with no body).
 * @param {Response} res - fetch Response
 * @param {any} defaultValue - value to return when body is empty or invalid (default: [])
 * @returns {Promise<any>}
 */
export async function safeJson(res, defaultValue = []) {
  const text = await res.text();
  if (!text || !text.trim()) return defaultValue;
  try {
    return JSON.parse(text);
  } catch {
    return defaultValue;
  }
}
