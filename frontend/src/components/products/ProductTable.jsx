// Owner: Member 02
import { Link } from "react-router-dom";
import formatPrice from "./formatPrice.js";

export default function ProductTable({ products, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Code</th><th>Product name</th><th>Category</th><th>Price</th><th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.product_id}>
              <td className="mono">{p.product_code}</td>
              <td><Link to={`/products/${p.product_id}`} className="cell-link">{p.product_name}</Link></td>
              <td className="muted">{p.category_name || "-"}</td>
              <td>{formatPrice(p.base_price)}</td>
              <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
              <td className="row-actions">
                <Link to={`/products/${p.product_id}`}>View</Link>
                <Link to={`/products/${p.product_id}/edit`}>Edit</Link>
                <button type="button" className="link-danger" onClick={() => onDelete(p)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
