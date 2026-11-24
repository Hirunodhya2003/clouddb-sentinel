const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

async function request(method, path, { params, data } = {}) {
  const url = new URL(
    `${API_BASE_URL}/${path.replace(/^\/+/, "")}`,
    window.location.origin
  );

  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = { Accept: "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  if (data !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method,
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
  });

  const contentType = response.headers.get("content-type") || "";
  const responseData =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    const message =
      typeof responseData?.detail === "string"
        ? responseData.detail
        : `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.response = { status: response.status, data: responseData };
    throw error;
  }

  return { data: responseData, status: response.status };
}

const api = {
  get: (path, config) => request("GET", path, config),
  post: (path, data) => request("POST", path, { data }),
  put: (path, data) => request("PUT", path, { data }),
  delete: (path, config) => request("DELETE", path, config),
};

export default api;
