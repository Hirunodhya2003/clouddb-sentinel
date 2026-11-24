// Owner: Member 08
/**
 * Optional Live API helper for Member 08 frontend services.
 *
 * Configuration:
 *   - Default mode: Development Mock Mode (`IS_DEVELOPMENT_MOCK_MODE = true`)
 *   - Enable Live API mode: set `VITE_M08_LIVE_API=true`
 *   - Live API base URL: `http://127.0.0.1:8018` (overrideable via `VITE_M08_API_BASE_URL`)
 *
 * Uses native `fetch` directly without depending on Member 02's unfinished `api.js`.
 */

const viteEnv =
  typeof import.meta !== 'undefined' && import.meta && import.meta.env
    ? import.meta.env
    : {};

const nodeEnv =
  typeof globalThis !== 'undefined' &&
  globalThis.process &&
  globalThis.process.env
    ? globalThis.process.env
    : {};

const rawLiveFlag =
  viteEnv.VITE_M08_LIVE_API ?? nodeEnv.VITE_M08_LIVE_API ?? 'false';

export const IS_M08_LIVE_API_ENABLED =
  String(rawLiveFlag).trim().toLowerCase() === 'true';

export const IS_DEVELOPMENT_MOCK_MODE = !IS_M08_LIVE_API_ENABLED;

export const M08_API_BASE_URL = String(
  viteEnv.VITE_M08_API_BASE_URL ??
    nodeEnv.VITE_M08_API_BASE_URL ??
    'http://127.0.0.1:8018'
).replace(/\/+$/, '');

/**
 * Formats FastAPI error payloads (`detail` string or Pydantic validation array)
 * into a human-readable Error message.
 */
function extractBackendErrorMessage(status, statusText, payload, url) {
  if (payload && typeof payload === 'object') {
    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail.trim();
    }
    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      const messages = payload.detail.map((entry) => {
        if (typeof entry === 'string') return entry;
        const loc = Array.isArray(entry?.loc)
          ? entry.loc.filter((part) => part !== 'body').join('.')
          : '';
        const msg = entry?.msg || JSON.stringify(entry);
        return loc ? `${loc}: ${msg}` : msg;
      });
      return messages.join('; ');
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
  }
  return `Backend API error (${status} ${statusText || 'HTTP Error'}) at ${url}`;
}

/**
 * Performs an HTTP JSON request against the Member 08 FastAPI server.
 *
 * @param {string} endpointPath - API path starting with `/api/v1/...`
 * @param {Object} [options]
 * @param {string} [options.method='GET']
 * @param {Object} [options.query] - Optional query parameters
 * @param {Object} [options.body] - Optional JSON body payload
 * @returns {Promise<any>}
 */
export async function m08FetchJson(endpointPath, options = {}) {
  const { method = 'GET', query = undefined, body = undefined } = options;

  const normalizedPath = endpointPath.startsWith('/')
    ? endpointPath
    : `/${endpointPath}`;

  const urlObj = new URL(`${M08_API_BASE_URL}${normalizedPath}`);
  if (query && typeof query === 'object') {
    for (const [key, value] of Object.entries(query)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== 'ALL'
      ) {
        urlObj.searchParams.set(key, String(value));
      }
    }
  }

  const headers = {
    Accept: 'application/json',
  };
  const fetchInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchInit.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(urlObj.toString(), fetchInit);
  } catch (networkErr) {
    const reason =
      networkErr instanceof Error ? networkErr.message : String(networkErr);
    throw new Error(
      `Unable to reach Member 08 FastAPI backend at ${urlObj.toString()}: ${reason}`
    );
  }

  let parsedBody = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = null;
    }
  } else {
    try {
      const text = await response.text();
      parsedBody = text ? { detail: text } : null;
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      extractBackendErrorMessage(
        response.status,
        response.statusText,
        parsedBody,
        urlObj.pathname
      )
    );
  }

  return parsedBody;
}

export default {
  IS_M08_LIVE_API_ENABLED,
  IS_DEVELOPMENT_MOCK_MODE,
  M08_API_BASE_URL,
  m08FetchJson,
};
