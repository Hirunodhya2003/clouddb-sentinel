// Owner: Member 02
import { useEffect, useState } from "react";
import categoryService from "../../services/categoryService.js";

const EMPTY = { product_code: "", product_name: "", category_id: "", description: "", base_price: "0", status: "active" };

export default function ProductForm({ initial, onSubmit, submitting, submitLabel = "Save product", onCancel }) {
  const [values, setValues] = useState({
    ...EMPTY,
    ...(initial && {
      ...initial,
      category_id: String(initial.category_id ?? ""),
      base_price: String(initial.base_price ?? "0"),
      description: initial.description || "",
    }),
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    categoryService.list().then(setCategories).catch((err) => setCategoryError(err.message));
  }, []);

  // New products can only use active categories; an existing product keeps its current one.
  const options = categories.filter(
    (c) => c.status === "active" || String(c.category_id) === String(initial?.category_id)
  );

  const change = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  function validate() {
    const next = {};
    const code = values.product_code.trim();
    const name = values.product_name.trim();
    const price = Number(values.base_price);
    if (!code) next.product_code = "Enter a product code.";
    else if (code.length > 30) next.product_code = "Use 30 characters or fewer.";
    if (!name) next.product_name = "Enter a product name.";
    else if (name.length > 150) next.product_name = "Use 150 characters or fewer.";
    if (!values.category_id) next.category_id = "Select a category.";
    if (values.base_price === "" || Number.isNaN(price)) next.base_price = "Enter a price.";
    else if (price < 0) next.base_price = "Price cannot be negative.";
    else if (!/^\d+(\.\d{1,2})?$/.test(String(values.base_price).trim())) next.base_price = "Use at most 2 decimal places.";
    if (values.description.length > 500) next.description = "Use 500 characters or fewer.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      product_code: values.product_code.trim(),
      product_name: values.product_name.trim(),
      category_id: Number(values.category_id),
      description: values.description.trim() || null,
      base_price: Number(values.base_price),
      status: values.status,
    });
  }

  return (
    <form className="form form-wide card" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">Basic information</h2>
      {categoryError && <div className="alert alert-error" role="alert">Could not load categories: {categoryError}</div>}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="product_name">Product name</label>
          <input id="product_name" name="product_name" value={values.product_name} onChange={change} aria-invalid={!!errors.product_name} />
          {errors.product_name && <span className="field-error">{errors.product_name}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="category_id">Category</label>
          <select id="category_id" name="category_id" value={values.category_id} onChange={change} aria-invalid={!!errors.category_id}>
            <option value="">Select a category</option>
            {options.map((c) => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
          {errors.category_id && <span className="field-error">{errors.category_id}</span>}
          {!categoryError && categories.length > 0 && options.length === 0 && (
            <span className="field-hint">No active categories. Create one first.</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="product_code">Product code</label>
          <input id="product_code" name="product_code" value={values.product_code} onChange={change} aria-invalid={!!errors.product_code} />
          {errors.product_code && <span className="field-error">{errors.product_code}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="base_price">Base price (INR)</label>
          <input id="base_price" name="base_price" type="number" min="0" step="0.01" inputMode="decimal" value={values.base_price} onChange={change} aria-invalid={!!errors.base_price} />
          {errors.base_price && <span className="field-error">{errors.base_price}</span>}
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} value={values.description} onChange={change} aria-invalid={!!errors.description} />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={values.status} onChange={change}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
