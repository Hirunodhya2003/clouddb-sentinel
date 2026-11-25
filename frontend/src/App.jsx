import { Navigate, Route, Routes } from "react-router-dom";

import "./App.css";

import AppLayout from "./layouts/MainLayout";
import LoginPage from "./pages/auth/Login";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import CustomerDetails from "./pages/customers/CustomerDetails";
import CustomerList from "./pages/customers/CustomerList";
import CreateCustomer from "./pages/customers/CreateCustomer";
import EditCustomer from "./pages/customers/EditCustomer";
import Dashboard from "./pages/dashboard/Dashboard";
import IntegrityCheck from "./pages/integrity-check/IntegrityCheck";
import RolesPage from "./pages/roles/RolesPage";
import UserFormPage from "./pages/users/UserFormpage";
import UserListPage from "./pages/users/UserList";
import UserProfilePage from "./pages/users/UserProfilePage";

function ForbiddenPage() {
  return (
    <main>
      <h1>403 - Forbidden</h1>
    </main>
  );
}

function guard(permission, element) {
  return <ProtectedRoute permission={permission}>{element}</ProtectedRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/new" element={<CreateCustomer />} />
        <Route path="/customers/:id/edit" element={<EditCustomer />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />
        <Route path="/integrity-check" element={<IntegrityCheck />} />

        <Route path="/users" element={guard("user:read", <UserListPage />)} />
        <Route path="/users/new" element={guard("user:create", <UserFormPage />)} />
        <Route path="/users/:id" element={guard("user:read", <UserProfilePage />)} />
        <Route
          path="/users/:id/edit"
          element={guard("user:update", <UserFormPage />)}
        />
        <Route path="/roles" element={guard("role:read", <RolesPage />)} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}