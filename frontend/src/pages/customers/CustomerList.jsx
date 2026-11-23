import { useState } from "react";
import CustomerForm from "../../components/customers/CustomerForm";
import CustomerDetails from "./CustomerDetails";

export default function CustomerList() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  const filteredCustomers = customers.filter((customer) =>
    [customer.name, customer.email, customer.phone].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ),
  );

  function handleSave(customer) {
    if (editingCustomer) {
      setCustomers((previous) =>
        previous.map((item) =>
          item.id === editingCustomer.id ? { ...item, ...customer } : item,
        ),
      );
    } else {
      setCustomers((previous) => [
        ...previous,
        { ...customer, id: crypto.randomUUID() },
      ]);
    }

    setShowForm(false);
    setEditingCustomer(null);
  }

  function confirmDelete() {
    if (!customerToDelete) return;

    setCustomers((previous) =>
      previous.filter((customer) => customer.id !== customerToDelete.id),
    );
    if (selectedCustomerId === customerToDelete.id) {
      setSelectedCustomerId(null);
    }

    setCustomerToDelete(null);
  }

  return (
    <>
      <div className="page-heading">
        <h1>Customers</h1>
        <p>Customer directory and contact information</p>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setEditingCustomer(null);
            setShowForm(true);
          }}
        >
          + Add customer
        </button>
      </div>

      {showForm && (
        <CustomerForm
          key={editingCustomer?.id ?? "new"}
          initialCustomer={editingCustomer}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}

      <section className="directory-card" aria-labelledby="directory-title">
        <h2 id="directory-title">Customers directory</h2>
        <p className="section-description">View and manage customer records.</p>

        <input
          className="customer-search"
          type="search"
          aria-label="Search customers"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {customerToDelete && (
          <div
            className="delete-confirmation"
            role="region"
            aria-label="Confirm customer deletion"
          >
            <p>
              Delete <strong>{customerToDelete.name}</strong>?
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCustomerToDelete(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={confirmDelete}
              >
                Yes, delete
              </button>
            </div>
          </div>
        )}

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
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.status}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      View
                    </button>{" "}
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setCustomerToDelete(null);
                        setEditingCustomer(customer);
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => setCustomerToDelete(customer)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
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
      </section>
    </>
  );
}
