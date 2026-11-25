import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/sentinel-layout.css";

export default function MainLayout() {
  const navigate = useNavigate();

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("permissions");
    navigate("/login", { replace: true });
  }

  return (
    <div className="sentinel-shell">
      <aside className="sentinel-sidebar">
        <div className="sentinel-brand">
          <span className="sentinel-brand-mark" aria-hidden="true">CD</span>
          <strong>CloudDB Sentinel</strong>
        </div>

        <nav className="sentinel-nav" aria-label="Main navigation">
          <div className="sentinel-nav-group">
            <p>Workspace</p>
            <NavLink to="/dashboard" end>Dashboard</NavLink>
            <NavLink to="/customers">Customers</NavLink>
            <NavLink to="/integrity-check">Integrity Check</NavLink>
          </div>

          <div className="sentinel-nav-group">
            <p>Product management</p>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/categories">Categories</NavLink>
            <NavLink to="/schema-viewer">Schema viewer</NavLink>
          </div>

          <div className="sentinel-nav-group">
            <p>Access management</p>
            <NavLink to="/users">Users</NavLink>
            <NavLink to="/roles">Roles &amp; permissions</NavLink>
          </div>
        </nav>

        <button className="sentinel-signout" type="button" onClick={signOut}>
          Sign out
        </button>
      </aside>

      <main className="sentinel-content">
        <Outlet />
      </main>
    </div>
  );
}
