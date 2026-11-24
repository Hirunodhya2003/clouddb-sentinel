import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import AppLayout from "./layouts/MainLayout";
import LoginPage from "./pages/auth/Login";
import UserListPage from "./pages/users/UserList";
import UserFormPage from "./pages/users/UserFormpage";
import UserProfilePage from "./pages/users/UserProfilePage";
import RolesPage from "./pages/roles/RolesPage";
import DashboardPlaceholder from "./pages/dashboard/Dashboard";

function ForbiddenPage() {
  return <main><h1>403 - Forbidden</h1></main>;
}

const guard = (permission, element) => (
  <ProtectedRoute permission={permission}>{element}</ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
        <Route path="/users" element={guard("user:read", <UserListPage />)} />
        <Route path="/users/new" element={guard("user:create", <UserFormPage />)} />
        <Route path="/users/:id" element={guard("user:read", <UserProfilePage />)} />
        <Route path="/users/:id/edit" element={guard("user:update", <UserFormPage />)} />
        <Route path="/roles" element={guard("role:read", <RolesPage />)} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}