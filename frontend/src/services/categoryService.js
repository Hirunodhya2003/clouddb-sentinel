// Owner: Member 02
// Expected backend contract (GET /api/v1/categories etc.):
//   category = { category_id, category_name, description, status: "active" | "inactive" }
// The list endpoint may return a plain array or { items, total }; both are handled.
import api from "./api.js";

const unwrap = (data) => (Array.isArray(data) ? data : data?.items ?? []);

const categoryService = {
  list: async (params) => unwrap(await api.get("/categories", params)),
  get: (id) => api.get(`/categories/${id}`),
  create: (payload) => api.post("/categories", payload),
  update: (id, payload) => api.put(`/categories/${id}`, payload),
  remove: (id) => api.delete(`/categories/${id}`),
};

export default categoryService;
