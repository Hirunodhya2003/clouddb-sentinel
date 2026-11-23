// Owner: Member 02
import { useState } from "react";

const EMPTY = { category_name: "", description: "", status: "active" };

export default function CategoryForm({ initial = EMPTY, onSubmit, submitting, submitLabel = "Save category", onCancel }) {
  const [values, setValues] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});

  const change = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  function validate() {
    const next = {};
    const name = values.category_name.trim();
    if (!name) next.category_name = "Enter a category name.";
    else if (name.length > 100) next.category_name = "Use 100 characters or fewer.";
    if (values.description.length > 255) next.description = "Use 255 characters or fewer.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      category_name: values.category_name.trim(),
      description: values.description.trim() || null,
      status: values.status,
    });
  }

  return (
    <form className="form card" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="category_name">Category name</label>
        <input id="category_name" name="category_name" value={values.category_name} onChange={change} aria-invalid={!!errors.category_name} />
        {errors.category_name && <span className="field-error">{errors.category_name}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} value={values.description || ""} onChange={change} />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" value={values.status} onChange={change}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
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
