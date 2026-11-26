
// Owner: Member 03
// Service: Product Variants

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const VARIANTS_URL = `${API_BASE_URL}/variants`;

async function handleResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail || data?.message || "Something went wrong"
    );
  }

  return data;
}

// Get all variants
export async function getAllVariants() {
  const response = await fetch(`${VARIANTS_URL}/`);
  return handleResponse(response);
}

// Get one variant by ID
export async function getVariantById(variantId) {
  const response = await fetch(`${VARIANTS_URL}/${variantId}`);
  return handleResponse(response);
}

// Create a new variant
export async function createVariant(variantData) {
  const response = await fetch(`${VARIANTS_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(variantData),
  });

  return handleResponse(response);
}

// Update an existing variant
export async function updateVariant(variantId, variantData) {
  const response = await fetch(`${VARIANTS_URL}/${variantId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(variantData),
  });

  return handleResponse(response);
}

// Delete a variant
export async function deleteVariant(variantId) {
  const response = await fetch(`${VARIANTS_URL}/${variantId}`, {
    method: "DELETE",
  });

  return handleResponse(response);
}
