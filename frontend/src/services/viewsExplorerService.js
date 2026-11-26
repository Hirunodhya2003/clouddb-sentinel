
 // Owner: Member 03
// Service: Views Explorer

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const VIEWS_URL = `${API_BASE_URL}/views`;

// Get all product summaries
export async function getProductSummaries() {
  const response = await fetch(`${VIEWS_URL}/products`);
  return handleResponse(response);
}

// Get one product summary
export async function getProductSummaryById(productId) {
  const response = await fetch(`${VIEWS_URL}/products/${productId}`);
  return handleResponse(response);
}

// Get all variant details
export async function getVariantDetails() {
  const response = await fetch(`${VIEWS_URL}/variants`);
  return handleResponse(response);
}

// Get one variant detail
export async function getVariantDetailsById(variantId) {
  const response = await fetch(`${VIEWS_URL}/variants/${variantId}`);
  return handleResponse(response);
}

// Handle API response
async function handleResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail || data?.message || "Failed to fetch view data"
    );
  }

  return data;
}
