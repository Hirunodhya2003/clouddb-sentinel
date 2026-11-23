import { useState } from "react";

export default function CustomerForm({
  initialCustomer,
  onSave,
  onCancel,
  saving = false,
}) {
  const [form, setForm] = useState({
    name: initialCustomer?.name ?? "",
    email: initialCustomer?.email ?? "",
    phone: initialCustomer?.phone ?? "",
    status: initialCustomer?.status ?? "Active",
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) return;

    onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
    });
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      <h2>{initialCustomer ? "Edit customer" : "Add customer"}</h2>

      <label htmlFor="customer-name">Customer name *</label>
      <input
        id="customer-name"
        name="name"
        value={form.name}
        onChange={handleChange}
        maxLength={150}
        required
      />

      <label htmlFor="customer-email">Email</label>
      <input
        id="customer-email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
      />

      <label htmlFor="customer-phone">Phone</label>
      <input
        id="customer-phone"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={handleChange}
      />

      <label htmlFor="customer-status">Status</label>
      <select
        id="customer-status"
        name="status"
        value={form.status}
        onChange={handleChange}
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? "Saving..." : "Save customer"}
        </button>
      </div>
    </form>
  );
}
