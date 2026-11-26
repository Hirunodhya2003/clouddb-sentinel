// Owner: Member 02
import { Link, useLocation } from "react-router-dom";
import { Search } from "lucide-react";

function toTitle(segment) {
  return segment.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default function Navbar() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <header className="navbar">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/dashboard">S.P. Apparels</Link>
        {parts.map((p, i) => (
          <span key={i}>
            <span className="crumb-sep">/</span>
            <Link to={"/" + parts.slice(0, i + 1).join("/")}>{toTitle(p)}</Link>
          </span>
        ))}
      </nav>

      <label className="navbar-search">
        <Search size={14} aria-hidden="true" />
        <input type="search" placeholder="Search workspace" aria-label="Search workspace" />
      </label>
    </header>
  );
}
