import api from "./client";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const apiError = (status, detail) => {
  const e = new Error(detail);
  e.response = { status, data: { detail } };
  return e;
};

let nextId = 6;
let MOCK_USERS = [
  { id: 1, full_name: "System Admin",     email: "admin@spapparels.com",   role: "Admin",           is_active: true,  last_login: "2026-11-18" },
  { id: 2, full_name: "Nimal Perera",     email: "nimal@spapparels.com",   role: "Manager",         is_active: true,  last_login: "2026-11-17" },
  { id: 3, full_name: "Kavindi Silva",    email: "kavindi@spapparels.com", role: "Inventory Clerk", is_active: true,  last_login: "2026-11-15" },
  { id: 4, full_name: "Ruwan Fernando",   email: "ruwan@spapparels.com",   role: "Sales Staff",     is_active: false, last_login: "2026-10-30" },
  { id: 5, full_name: "Amaya Jayasinghe", email: "amaya@spapparels.com",   role: "Viewer",          is_active: true,  last_login: null },
];

export async function fetchUsers({ search = "", role = "", status = "" } = {}) {
  if (USE_MOCK) {
    await delay(400);
    const q = search.toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        (!q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (!role || u.role === role) &&
        (!status || (status === "active") === u.is_active)
    );
  }
  return (await api.get("/users", { params: { search, role, status } })).data;
}

export async function fetchUser(id) {
  if (USE_MOCK) {
    await delay();
    const u = MOCK_USERS.find((x) => x.id === Number(id));
    if (!u) throw apiError(404, "User not found");
    return { ...u };
  }
  return (await api.get(`/users/${id}`)).data;
}

export async function createUser(data) {
  if (USE_MOCK) {
    await delay();
    const email = data.email.toLowerCase();
    if (MOCK_USERS.some((u) => u.email === email)) throw apiError(409, "A user with this email already exists");
    const u = { id: nextId++, full_name: data.full_name, email, role: data.role, is_active: data.is_active, last_login: null };
    MOCK_USERS.push(u);
    return u;
  }
  return (await api.post("/users", data)).data;
}

export async function updateUser(id, data) {
  if (USE_MOCK) {
    await delay();
    const u = MOCK_USERS.find((x) => x.id === Number(id));
    if (!u) throw apiError(404, "User not found");
    const email = data.email.toLowerCase();
    if (MOCK_USERS.some((x) => x.email === email && x.id !== u.id)) throw apiError(409, "A user with this email already exists");
    Object.assign(u, { full_name: data.full_name, email, role: data.role, is_active: data.is_active });
    return { ...u };
  }
  return (await api.put(`/users/${id}`, data)).data;
}

export async function deleteUser(id) {
  if (USE_MOCK) {
    await delay();
    const u = MOCK_USERS.find((x) => x.id === Number(id));
    if (u) u.is_active = false;
    return;
  }
  await api.delete(`/users/${id}`);
}