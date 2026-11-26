// Owner: Member 02
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductTable from "../../components/products/ProductTable.jsx";
import productService from "../../services/productService.js";
import categoryService from "../../services/categoryService.js";

const PAGE_SIZE = 10;

export default function ProductList() {
  const [result, setResult] = useState({ items: [], total: 0, page: 1, page_size: PAGE_SIZE });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Wait for the user to stop typing before searching.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    productService
      .list({ search, category_id: categoryId, status, page, page_size: PAGE_SIZE })
      .then((data) => { if (!cancelled) setResult(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, categoryId, status, page, reloadKey]);

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.product_name}"? This cannot be undone.`)) return;
    try {
      await productService.remove(product.product_id);
      // Step back a page if that was the last row on it.
      if (result.items.length === 1 && page > 1) setPage(page - 1);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const from = result.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, result.total);
  const filtered = Boolean(search || categoryId || status);

  return (
    <>
      <div className="page-header page-header-row">
        <div>
          <h1>Products</h1>
          <p>Manage apparel products and their categories.</p>
        </div>
        <Link to="/products/new" className="btn btn-primary">New product</Link>
      </div>

      <div className="card">
        <div className="toolbar">
          <input
            type="search" placeholder="Search by product code or name" aria-label="Search products"
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          />
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {loading ? (
          <p className="muted">Loading products...</p>
        ) : result.items.length === 0 ? (
          <p className="muted">{filtered ? "No products match your filters." : "No products yet. Create your first product."}</p>
        ) : (
          <>
            <ProductTable products={result.items} onDelete={handleDelete} />
            <div className="pager">
              <span className="muted">Showing {from}-{to} of {result.total}</span>
              <div className="pager-buttons">
                <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span className="muted">Page {page} of {totalPages}</span>
                <button type="button" className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
