// Owner: Member 02
// TODO: wrap <AppRoutes /> with BrowserRouter + AuthContext provider
import { useState } from "react";
import "./App.css";
import CustomerList from "./pages/customers/CustomerList";

const menuGroups = [
  {
    title: "Workspace",
    items: [
      "Dashboard",
      "Products",
      "Inventory",
      "Procurement",
      "Sales",
      "Customers",
      "Reports",
    ],
  },
  {
    title: "Database & Security",
    items: ["Database Tools", "Performance", "Audit & Recovery"],
  },
  {
    title: "Administration",
    items: ["Users & Roles", "Settings"],
  },
];

export default function App() {
  const [menuSearch, setMenuSearch] = useState("");

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">SP</span>
          <div>
            <strong>S.P. APPARELS</strong>
            <span className="brand-subtitle">CLOUDDB SENTINEL</span>
          </div>
        </div>

        <div className="workspace-card">
          <span className="workspace-logo">S</span>
          <div>
            <strong>S.P. Apparels</strong>
            <small>Enterprise workspace</small>
          </div>
        </div>

        <input
          className="menu-search"
          aria-label="Search menu"
          placeholder="Search menu..."
          value={menuSearch}
          onChange={(event) => setMenuSearch(event.target.value)}
        />

        <nav className="navigation" aria-label="Main navigation">
          {menuGroups.map((group) => {
            const items = group.items.filter((item) =>
              item.toLowerCase().includes(menuSearch.toLowerCase()),
            );

            if (items.length === 0) return null;

            return (
              <div className="menu-group" key={group.title}>
                <p className="menu-heading">{group.title}</p>

                {items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`menu-item ${item === "Customers" ? "active" : ""}`}
                    aria-current={item === "Customers" ? "page" : undefined}
                    disabled={item !== "Customers"}
                  >
                    {item}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-profile">
          <span className="avatar">SA</span>
          <div>
            <strong>System Admin</strong>
            <small>Administrator</small>
          </div>
        </div>
      </aside>

      <div className="main-layout">
        <header className="topbar">
          <p>
            S.P. Apparels <span>/</span> Customer management
          </p>
          <span className="avatar avatar-light" aria-label="System Admin">
            SA
          </span>
        </header>

        <main className="page-content">
          <CustomerList />
        </main>
      </div>
    </div>
  );
}
