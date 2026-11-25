import { useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";

import "./App.css";
import CustomerList from "./pages/customers/CustomerList";
import CreateCustomer from "./pages/customers/CreateCustomer";
import EditCustomer from "./pages/customers/EditCustomer";
import CustomerDetails from "./pages/customers/CustomerDetails";
import IntegrityCheck from "./pages/integrity-check/IntegrityCheck";

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
    items: [
      "Integrity Check",
      "Database Tools",
      "Performance",
      "Audit & Recovery",
    ],
  },
  {
    title: "Administration",
    items: ["Users & Roles", "Settings"],
  },
];

export default function App() {
  const [menuSearch, setMenuSearch] = useState("");

  return (
    <BrowserRouter>
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
                item.toLowerCase().includes(menuSearch.trim().toLowerCase()),
              );

              if (items.length === 0) return null;

              return (
                <div className="menu-group" key={group.title}>
                  <p className="menu-heading">{group.title}</p>

                  {items.map((item) =>
                    item === "Customers" || item === "Integrity Check" ? (
                      <Link
                        key={item}
                        to={
                          item === "Customers"
                            ? "/customers"
                            : "/integrity-check"
                        }
                        className="menu-item"
                        style={{ textDecoration: "none" }}
                      >
                        {item}
                      </Link>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className="menu-item"
                        disabled
                      >
                        {item}
                      </button>
                    ),
                  )}
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
            <Routes>
              <Route path="/" element={<Navigate to="/customers" replace />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/new" element={<CreateCustomer />} />
              <Route path="/customers/:id/edit" element={<EditCustomer />} />
              <Route path="/customers/:id" element={<CustomerDetails />} />
              <Route path="/integrity-check" element={<IntegrityCheck />} />
              <Route
                path="*"
                element={
                  <section className="directory-card">
                    <h1>Page not found</h1>
                    <Link to="/customers">Back to customers</Link>
                  </section>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
