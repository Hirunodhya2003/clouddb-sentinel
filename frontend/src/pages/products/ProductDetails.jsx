// Owner: Member 02
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import productService from "../../services/productService.js";
import formatPrice from "../../components/products/formatPrice.js";

const fmtDate = (v) => (v ? new Date(v).toLocaleString() : "-");

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setProduct(null);
    setError("");
    productService.get(id).then(setProduct).catch((err) => setError(err.message));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete "${product.product_name}"? This cannot be undone.`)) return;
    try {
      await productService.remove(product.product_id);
      navigate("/products");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-header page-header-row">
        <div>
          <h1>Product details</h1>
          <p>Review product information and status.</p>
        </div>
        {product && (
          <div className="header-actions">
            <Link to="/products" className="btn btn-secondary">Back</Link>
            <Link to={`/products/${product.product_id}/edit`} className="btn btn-primary">Edit product</Link>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {!product && !error && <p className="muted">Loading product...</p>}

      {product && (
        <div className="card">
          <h2 className="form-title">Record overview</h2>
          <dl className="details-grid">
            <div><dt>Product code</dt><dd className="mono">{product.product_code}</dd></div>
            <div><dt>Product name</dt><dd>{product.product_name}</dd></div>
            <div><dt>Category</dt><dd>{product.category_name || "-"}</dd></div>
            <div><dt>Base price</dt><dd>{formatPrice(product.base_price)}</dd></div>
            <div><dt>Status</dt><dd><span className={`badge badge-${product.status}`}>{product.status}</span></dd></div>
            <div><dt>Last updated</dt><dd>{fmtDate(product.updated_at)}</dd></div>
            <div className="details-full"><dt>Description</dt><dd>{product.description || "-"}</dd></div>
            <div><dt>Created</dt><dd>{fmtDate(product.created_at)}</dd></div>
          </dl>
          <div className="details-footer">
            <button type="button" className="link-danger" onClick={handleDelete}>Delete product</button>
          </div>
        </div>
      )}
    </>
  );
}
