// Owner: Member 02
// Backend contract (GET /api/v1/products):
//   product = { product_id, product_code, product_name, category_id, category_name,
//               description, base_price, status: "active" | "inactive", created_at, updated_at }
//   list    = { items: [product], total, page, page_size }
//   query   = search, category_id, status, page, page_size
import api from "./api.js";

const productService = {
  list: async (params) => {
    const data = await api.get("/products", params);
    if (Array.isArray(data)) return { items: data, total: data.length, page: 1, page_size: data.length };
    return { items: data?.items ?? [], total: data?.total ?? 0, page: data?.page ?? 1, page_size: data?.page_size ?? 10 };
  },
  get: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post("/products", payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
};

export default productService;
