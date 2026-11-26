const API_URL = "http://127.0.0.1:8000/api/v1/customers";

async function request(path = "", options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;

    const message = Array.isArray(detail)
      ? detail.map((error) => error.msg).join(", ")
      : detail;

    throw new Error(message || `Request failed (${response.status}).`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getCustomers(signal) {
  return request("", { signal });
}

export function getCustomer(id, signal) {
  return request(`/${id}`, { signal });
}

export function createCustomer(customer) {
  return request("", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customer),
  });
}

export function updateCustomer(id, customer) {
  return request(`/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customer),
  });
}

export function deleteCustomer(id) {
  return request(`/${id}`, {
    method: "DELETE",
  });
}
