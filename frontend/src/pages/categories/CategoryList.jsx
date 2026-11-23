// Owner: Member 02
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import categoryService from "../../services/categoryService.js";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setCategories(await categoryService.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(cat) {
    if (!window.confirm(`Delete "${cat.category_name}"? This cannot be undone.`)) return;
    try {
      await categoryService.remove(cat.category_id);
      setCategories((list) => list.filter((c) => c.category_id !== cat.category_id));
    } catch (err) {
      // e.g. the category still has products
      setError(err.message);
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (!q || c.category_name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q))
    );
  }, [categories, search, status]);

  return (
    <>
      <div className="page-header page-header-row">
        <div>
          <h1>Categories</h1>
          <p>Organise your apparel catalogue into categories.</p>
        </div>
        <Link to="/categories/new" className="btn btn-primary">New category</Link>
      </div>

      <div className="card">
        <div className="toolbar">
          <input
            type="search" placeholder="Search by name or description" aria-label="Search categories"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {loading ? (
          <p className="muted">Loading categories...</p>
        ) : visible.length === 0 ? (
          <p className="muted">
            {categories.length === 0 ? "No categories yet. Create your first category." : "No categories match your filters."}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Description</th><th>Status</th><th aria-label="Actions" /></tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.category_id}>
                    <td>{c.category_name}</td>
                    <td className="muted">{c.description || "-"}</td>
                    <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                    <td className="row-actions">
                      <Link to={`/categories/${c.category_id}/edit`}>Edit</Link>
                      <button type="button" className="link-danger" onClick={() => handleDelete(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
