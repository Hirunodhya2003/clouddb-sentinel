
import { useState } from "react";
import SizeSelector from "./SizeSelector";
import ColorSelector from "./ColorSelector";

export default function VariantForm({
  initialData = {},
  onSubmit,
  submitLabel = "Save Variant",
  loading = false,
}) {
  const [formData, setFormData] = useState({
    product_id: initialData.product_id ?? "",
    size_id: initialData.size_id ?? "",
    colour_id: initialData.colour_id ?? "",
    sku: initialData.sku ?? "",
    cost_price: initialData.cost_price ?? "0.00",
    selling_price: initialData.selling_price ?? "",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (
      !formData.product_id ||
      !formData.size_id ||
      !formData.colour_id ||
      !formData.sku.trim() ||
      formData.selling_price === ""
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const payload = {
      product_id: Number(formData.product_id),
      size_id: Number(formData.size_id),
      colour_id: Number(formData.colour_id),
      sku: formData.sku.trim(),
      cost_price: Number(formData.cost_price),
      selling_price: Number(formData.selling_price),
    };

    if (
      !Number.isFinite(payload.cost_price) ||
      !Number.isFinite(payload.selling_price) ||
      payload.cost_price < 0 ||
      payload.selling_price < 0
    ) {
      setError("Prices must be valid non-negative numbers.");
      return;
    }

    onSubmit?.(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Product Variant</h2>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="product_id">Product ID</label>
        <input
          id="product_id"
          name="product_id"
          type="number"
          min="1"
          value={formData.product_id}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <SizeSelector
        value={formData.size_id}
        onChange={(value) =>
          setFormData((previous) => ({
            ...previous,
            size_id: value,
          }))
        }
        disabled={loading}
      />

      <ColorSelector
        value={formData.colour_id}
        onChange={(value) =>
          setFormData((previous) => ({
            ...previous,
            colour_id: value,
          }))
        }
        disabled={loading}
      />

      <div>
        <label htmlFor="sku">SKU</label>
        <input
          id="sku"
          name="sku"
          type="text"
          maxLength="50"
          value={formData.sku}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="cost_price">Cost Price</label>
        <input
          id="cost_price"
          name="cost_price"
          type="number"
          min="0"
          step="0.01"
          value={formData.cost_price}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="selling_price">Selling Price</label>
        <input
          id="selling_price"
          name="selling_price"
          type="number"
          min="0"
          step="0.01"
          value={formData.selling_price}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
