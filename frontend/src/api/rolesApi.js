import api from "./client";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const CRUD = ["read", "create", "update", "delete"];
const MODULES = {
  user: CRUD, role: ["read", "update"], product: CRUD, category: CRUD, variant: CRUD,
  supplier: CRUD, purchase: CRUD, inventory: ["read", "index"], customer: CRUD, sale: CRUD,
  stock: ["read", "adjust"], report: ["read"], performance: ["read"], audit: ["read"],
  backup: ["manage"], settings: ["manage"],
};
const ALL = Object.entries(MODULES).flatMap(([m, acts]) => acts.map((a) => `${m}:${a}`));

let MOCK_ROLES = [
  { id: 1, name: "Admin", description: "Full system access", permissions: ALL },
  { id: 2, name: "Manager", description: "Manage business operations",
    permissions: ALL.filter((c) => !/^(user|role|backup|settings):/.test(c)) },
  { id: 3, name: "Inventory Clerk", description: "Products, stock and procurement",
    permissions: [...ALL.filter((c) => /^(product|category|variant|inventory|stock|supplier|purchase):/.test(c)), "report:read"] },
  { id: 4, name: "Sales Staff", description: "Customers and sales",
    permissions: ["customer:read", "customer:create", "customer:update", "sale:read", "sale:create",
                  "product:read", "variant:read", "inventory:read", "report:read"] },
  { id: 5, name: "Viewer", description: "Read-only access",
    permissions: ALL.filter((c) => c.endsWith(":read") && !/^(user|role|audit):/.test(c)) },
];

export async function fetchRoles() {
  if (USE_MOCK) {
    await delay();
    return MOCK_ROLES.map((r) => ({ ...r, permissions: [...r.permissions] }));
  }
  return (await api.get("/roles")).data;
}

export async function fetchPermissions() {
  if (USE_MOCK) {
    await delay();
    return ALL.map((code, i) => ({ id: i + 1, code }));
  }
  return (await api.get("/permissions")).data;
}

export async function saveRolePermissions(roleId, codes) {
  if (USE_MOCK) {
    await delay();
    const r = MOCK_ROLES.find((x) => x.id === roleId);
    if (r) r.permissions = [...codes];
    return;
  }
  await api.put(`/roles/${roleId}/permissions`, { permissions: codes });
}