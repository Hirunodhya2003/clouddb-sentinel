import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getCustomer } from "../../services/customerService";

export default function CustomerDetails() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setCustomer(null);
    setError("");

    async function loadCustomer() {
      try {
        const record = await getCustomer(id, controller.signal);

        if (!controller.signal.aborted) {
          setCustomer(record);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCustomer();

    return () => controller.abort();
  }, [id]);

  return (
    <>
      <div className="details-heading">
        <div>
          <h1>Customer Details</h1>
          <p>Customer profile and contact information</p>
        </div>

        <Link className="primary-button page-link" to="/customers/new">
          + New customer
        </Link>
      </div>

      {loading && <p role="status">Loading customer...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && customer && (
        <div className="customer-details-grid">
          <section className="directory-card record-overview">
            <h2>Record overview</h2>

            <dl className="record-fields">
              <div>
                <dt>Customer ID</dt>
                <dd>#{customer.id}</dd>
              </div>

              <div>
                <dt>Customer name</dt>
                <dd>{customer.name}</dd>
              </div>

              <div>
                <dt>Email</dt>
                <dd>{customer.email || "Not provided"}</dd>
              </div>

              <div>
                <dt>Phone</dt>
                <dd>{customer.phone || "Not provided"}</dd>
              </div>

              <div>
                <dt>Status</dt>
                <dd>
                  <span
                    className={
                      customer.status === "Active"
                        ? "customer-status is-active"
                        : "customer-status is-inactive"
                    }
                  >
                    {customer.status}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="directory-card record-information">
            <h2>Record information</h2>

            <dl className="record-fields">
              <div>
                <dt>Created at</dt>
                <dd>{formatTimestamp(customer.created_at)}</dd>
              </div>

              <div>
                <dt>Last updated</dt>
                <dd>{formatTimestamp(customer.updated_at)}</dd>
              </div>
            </dl>

            <div className="details-actions">
              <Link
                className="primary-button page-link"
                to={`/customers/${customer.id}/edit`}
              >
                Edit customer
              </Link>

              <Link className="secondary-button page-link" to="/customers">
                Back to customers
              </Link>
            </div>
          </section>
        </div>
      )}

      {!loading && !customer && <Link to="/customers">Back to customers</Link>}
    </>
  );
}

function formatTimestamp(value) {
  if (!value) return "Not available";

  return value.replace("T", " ");
}
