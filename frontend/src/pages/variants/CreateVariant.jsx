
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import VariantForm from "../../components/variants/VariantForm";
import { createVariant } from "../../services/variantService";

export default function CreateVariant() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateVariant(variantData) {
    try {
      setLoading(true);
      setError("");

      await createVariant(variantData);

      alert("Variant created successfully!");

      navigate("/variants");
    } catch (err) {
      setError(err.message || "Failed to create variant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Create Product Variant</h1>

      {error && <p role="alert">{error}</p>}

      <VariantForm
        onSubmit={handleCreateVariant}
        submitLabel="Create Variant"
        loading={loading}
      />
    </div>
  );
}
