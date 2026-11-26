// Owner: Member 05
// API service for database index management.

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || "Index manager request failed");
  }

  return data;
}

const indexManagerService = {
  getIndexes: () => request("/index-manager/"),

  createIndex: (indexData) =>
    request("/index-manager/", {
      method: "POST",
      body: JSON.stringify(indexData),
    }),

  deleteIndex: (tableName, indexName) =>
    request(
      `/index-manager/${encodeURIComponent(tableName)}/${encodeURIComponent(indexName)}`,
      { method: "DELETE" }
    ),
};

export default indexManagerService;
