// Owner: Member 05
// API service for inventory management.

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
    throw new Error(data?.detail || "Inventory request failed");
  }

  return data;
}

const inventoryService = {
  getAll: () => request("/inventory/"),

  getLowStock: () => request("/inventory/low-stock"),

  getByVariant: (variantId) =>
    request(`/inventory/${variantId}`),

  getMovements: () => request("/inventory/movements"),
  
  updateReorderLevel: (variantId, reorderLevel) =>
    request(`/inventory/${variantId}/reorder-level`, {
      method: "PATCH",
      body: JSON.stringify({ reorder_level: reorderLevel }),
    }),

  createAdjustment: (adjustment) =>
    request("/inventory/adjustments", {
      method: "POST",
      body: JSON.stringify(adjustment),
    }),
};

export default inventoryService;
