// Owner: Member 06
// TODO: implement
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import CustomerForm from "../../components/customers/CustomerForm";
import { getCustomer, updateCustomer } from "../../services/customerService";

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submitting = useRef(false);

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

  async function handleSave(values) {
    if (submitting.current) return;

    submitting.current = true;
    setSaving(true);
    setError("");

    try {
      await updateCustomer(id, values);
      navigate("/customers");
    } catch (error) {
      setError(error.message);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1>Edit customer</h1>
        <p>Update customer contact information.</p>
      </div>

      {loading && <p role="status">Loading customer...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && customer && (
        <CustomerForm
          key={customer.id}
          initialCustomer={customer}
          saving={saving}
          onSave={handleSave}
          onCancel={() => {
            if (!submitting.current) {
              navigate("/customers");
            }
          }}
        />
      )}

      {!loading && !customer && <Link to="/customers">Back to customers</Link>}
    </>
  );
}
