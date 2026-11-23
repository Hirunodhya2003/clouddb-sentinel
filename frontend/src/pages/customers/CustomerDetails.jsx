export default function CustomerDetails({ customer, onClose }) {
  return (
    <section className="directory-card customer-details">
      <h2>Customer details</h2>

      <dl>
        <dt>Name</dt>
        <dd>{customer.name}</dd>

        <dt>Email</dt>
        <dd>{customer.email || "—"}</dd>

        <dt>Phone</dt>
        <dd>{customer.phone || "—"}</dd>

        <dt>Status</dt>
        <dd>{customer.status}</dd>
      </dl>

      <button
        type="button"
        className="secondary-button"
        onClick={onClose}
      >
        Close details
      </button>
    </section>
  );
}