import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, permission }) => {
  const token = localStorage.getItem("token");
  const { can } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <Navigate to="/403" replace />;
  return children ?? <Outlet />;
};

export default ProtectedRoute;