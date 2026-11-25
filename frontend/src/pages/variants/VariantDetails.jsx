
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getVariantById } from "../../services/variantService";

export default function VariantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVariant() {
      try {
        setLoading(true);
        setError("");

        const data = await getVariantById(id);
        setVariant(data);
      } catch (err) {
        setError(err.message || "Failed to load variant details");
      } finally {
        setLoading(false);
      }
    }

    loadVariant();
  }, [id]);

  if (loading) {
    return <p>Loading variant details...</p>;
  }

  if (error || !variant) {
    return (
      <div>
        <p role="alert">{error || "Variant not found"}</p>
        <button onClick={() => navigate("/variants")}>
          Back to Variants
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Variant Details</h1>

      <table>
        <tbody>
          <tr>
            <th>Variant ID</th>
            <td>{variant.variant_id}</td>
          </tr>
          <tr>
            <th>Product ID</th>
            <td>{variant.product_id}</td>
          </tr>
          <tr>
            <th>Size ID</th>
            <td>{variant.size_id}</td>
          </tr>
          <tr>
            <th>Colour ID</th>
            <td>{variant.colour_id}</td>
          </tr>
          <tr>
            <th>SKU</th>
            <td>{variant.sku}</td>
          </tr>
          <tr>
            <th>Cost Price</th>
            <td>{Number(variant.cost_price).toFixed(2)}</td>
          </tr>
          <tr>
            <th>Selling Price</th>
            <td>{Number(variant.selling_price).toFixed(2)}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>{variant.is_active ? "Active" : "Inactive"}</td>
          </tr>
          <tr>
            <th>Created At</th>
            <td>{variant.created_at}</td>
          </tr>
          <tr>
            <th>Updated At</th>
            <td>{variant.updated_at}</td>
          </tr>
        </tbody>
      </table>

      <button onClick={() => navigate("/variants")}>
        Back to Variants
      </button>

      <button
        onClick={() => navigate(`/variants/edit/${variant.variant_id}`)}
      >
        Edit Variant
      </button>
    </div>
  );
}
