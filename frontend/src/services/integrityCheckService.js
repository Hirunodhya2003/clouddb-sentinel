// Owner: Member 06
// TODO: implement
const API_URL = "http://127.0.0.1:8000/api/v1/integrity";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    const message = Array.isArray(body?.detail)
      ? body.detail.map((item) => item.msg).join(", ")
      : body?.detail;

    throw new Error(message || `Request failed (${response.status}).`);
  }

  return response.json();
}

export function runIntegrityChecks(checks) {
  return request("/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checks }),
  });
}

export function getIntegrityResults(signal) {
  return request("/results", { signal });
}
