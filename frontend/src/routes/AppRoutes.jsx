// Owner: Member 02
// To add your route: describe it (path + page component) in your PR. Member 02 adds it here.
// When your real page is merged, replace its <ComingSoon /> element with the page component.
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import ComingSoon from "../pages/shared/ComingSoon.jsx";
import CategoryList from "../pages/categories/CategoryList.jsx";
import CreateCategory from "../pages/categories/CreateCategory.jsx";
import EditCategory from "../pages/categories/EditCategory.jsx";

const soon = (title) => <ComingSoon title={title} />;

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={soon("Sign in")} />
      </Route>

      {/* TODO: wrap in <ProtectedRoute> once Member 01 merges it */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={soon("Dashboard")} />

        {/* Member 02 */}
        <Route path="/products" element={soon("Products")} />
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/categories/new" element={<CreateCategory />} />
        <Route path="/categories/:id/edit" element={<EditCategory />} />
        <Route path="/schema-viewer" element={soon("Schema viewer")} />

        {/* Other members: replace as pages are merged */}
        <Route path="/variants" element={soon("Variants")} />
        <Route path="/views-explorer" element={soon("Views explorer")} />
        <Route path="/inventory" element={soon("Inventory")} />
        <Route path="/purchases" element={soon("Procurement")} />
        <Route path="/sales" element={soon("Sales")} />
        <Route path="/customers" element={soon("Customers")} />
        <Route path="/reports" element={soon("Reports")} />
        <Route path="/performance" element={soon("Performance")} />
        <Route path="/audit-logs" element={soon("Audit and recovery")} />
        <Route path="/users" element={soon("Users and roles")} />
        <Route path="/database-admin" element={soon("Database admin")} />
        <Route path="/settings" element={soon("Settings")} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
