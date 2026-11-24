// Owner: Member 06
// TODO: implement
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerForm from "../../components/customers/CustomerForm";
import { createCustomer } from "../../services/customerService";

export default function CreateCustomer() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function handleSave(customer) {
    if (submitting.current) return;

    submitting.current = true;
    setSaving(true);
    setError("");

    try {
      await createCustomer(customer);
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
        <h1>Create customer</h1>
        <p>Add customer contact information.</p>
      </div>

      {error && <p role="alert">{error}</p>}

      <CustomerForm
        saving={saving}
        onSave={handleSave}
        onCancel={() => {
          if (!submitting.current) {
            navigate("/customers");
          }
        }}
      />
    </>
  );
}
