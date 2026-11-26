export default function VariantTable({
  variants = [],
  onView,
  onEdit,
  onDelete,
}) {
  if (variants.length === 0) {
    return <p>No product variants found.</p>;
  }

  return (
    <div>
      <h2>Product Variants</h2>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Variant ID</th>
              <th>Product ID</th>
              <th>Size ID</th>
              <th>Colour ID</th>
              <th>SKU</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {variants.map((variant) => (
              <tr key={variant.variant_id}>
                <td>{variant.variant_id}</td>
                <td>{variant.product_id}</td>
                <td>{variant.size_id}</td>
                <td>{variant.colour_id}</td>
                <td>{variant.sku}</td>
                <td>{Number(variant.cost_price).toFixed(2)}</td>
                <td>{Number(variant.selling_price).toFixed(2)}</td>
                <td>
                  {variant.is_active ? "Active" : "Inactive"}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onView?.(variant)}
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit?.(variant)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete?.(variant.variant_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}