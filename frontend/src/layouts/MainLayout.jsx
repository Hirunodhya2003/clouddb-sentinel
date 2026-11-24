import { Link, Outlet, useNavigate } from "react-router-dom";

export default function MainLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("permissions");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>CloudDB Sentinel</h2>

        <nav aria-label="Main navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/integrity-check">Integrity Check</Link>
          <Link to="/users">Users</Link>
          <Link to="/roles">Roles &amp; permissions</Link>
        </nav>

        <button type="button" className="btn-ghost" onClick={logout}>
          Sign out
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}