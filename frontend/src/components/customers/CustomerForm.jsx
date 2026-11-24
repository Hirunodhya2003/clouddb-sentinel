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

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (saving || !form.name.trim()) return;

    onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
    });
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      <div className="customer-form-heading">
        <h2>Basic information</h2>
        <p>Complete the customer information. Name is required.</p>
      </div>

      <fieldset className="customer-form-fields" disabled={saving}>
        <legend className="form-legend">Customer information</legend>

        <div className="customer-field">
          <label htmlFor="customer-name">Customer name *</label>
          <input
            id="customer-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter customer name"
            maxLength={150}
            pattern=".*\S.*"
            title="Enter a name containing at least one non-space character."
            autoComplete="name"
            required
          />
        </div>

        <div className="customer-field">
          <label htmlFor="customer-email">Email</label>
          <input
            id="customer-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email address"
            maxLength={254}
            autoComplete="email"
          />
        </div>

        <div className="customer-field">
          <label htmlFor="customer-phone">Phone</label>
          <input
            id="customer-phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            maxLength={30}
            autoComplete="tel"
          />
        </div>

        <div className="customer-field">
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
        </div>
      </fieldset>

      <div className="customer-form-footer">
        <p>Email and phone are optional.</p>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button type="submit" className="primary-button" disabled={saving}>
            {saving
              ? "Saving..."
              : initialCustomer
                ? "Save changes"
                : "Create customer"}
          </button>
        </div>
      </div>
    </form>
  );
}
