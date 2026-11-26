// Owner: Member 06
// TODO: implement
export default function CustomerTable({
  customers,
  loading,
  error,
  search,
  busy = false,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th scope="col">Customer</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email || "—"}</td>
              <td>{customer.phone || "—"}</td>
              <td>{customer.status}</td>

              <td>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => onView(customer)}
                >
                  View
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => onEdit(customer)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  disabled={busy}
                  onClick={() => onDelete(customer)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {!loading && !error && customers.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">
                {search.trim()
                  ? "No customers match your search."
                  : "No customers added yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
