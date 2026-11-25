// Owner: Member 02
// To add a page to the sidebar, ask Member 02 in your PR description (path + label).
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, Tags, Layers, Boxes, Truck, ShoppingCart, Users,
  FileBarChart, Database, Eye, Gauge, ShieldCheck, History, Settings, UserCog,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    title: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/products", label: "Products", icon: Package },
      { to: "/categories", label: "Categories", icon: Tags },
      { to: "/variants", label: "Variants", icon: Layers },
      { to: "/inventory", label: "Inventory", icon: Boxes },
      { to: "/purchases", label: "Procurement", icon: Truck },
      { to: "/sales", label: "Sales", icon: ShoppingCart },
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    title: "Database and security",
    items: [
      { to: "/schema-viewer", label: "Schema viewer", icon: Database },
      { to: "/views-explorer", label: "Views explorer", icon: Eye },
      { to: "/performance", label: "Performance", icon: Gauge },
      { to: "/audit-logs", label: "Audit and recovery", icon: History },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/users", label: "Users and roles", icon: UserCog },
      { to: "/database-admin", label: "Database admin", icon: ShieldCheck },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">SP</span>
        <div>
          <div className="brand-name">S.P. Apparels</div>
          <div className="brand-sub">CloudDB Sentinel</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_SECTIONS.map((section) => (
          <div className="nav-section" key={section.title}>
            <div className="nav-section-title">{section.title}</div>
            {section.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <span className="avatar">SA</span>
        <div>
          <div className="user-name">System Admin</div>
          <div className="user-role">Super administrator</div>
        </div>
      </div>
    </aside>
  );
}
