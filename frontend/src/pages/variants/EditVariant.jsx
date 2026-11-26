
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import VariantForm from "../../components/variants/VariantForm";

import {
  getVariantById,
  updateVariant,
} from "../../services/variantService";

export default function EditVariant() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVariant() {
      try {
        setLoading(true);
        setError("");

        const data = await getVariantById(id);
        setVariant(data);
      } catch (err) {
        setError(err.message || "Failed to load variant");
      } finally {
        setLoading(false);
      }
    }

    loadVariant();
  }, [id]);

  async function handleUpdateVariant(variantData) {
    try {
      setSaving(true);
      setError("");

      await updateVariant(id, variantData);

      alert("Variant updated successfully!");

      navigate("/variants");
    } catch (err) {
      setError(err.message || "Failed to update variant");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading variant...</p>;
  }

  if (!variant) {
    return <p role="alert">{error || "Variant not found"}</p>;
  }

  return (
    <div>
      <h1>Edit Product Variant</h1>

      {error && <p role="alert">{error}</p>}

      <VariantForm
        initialData={variant}
        onSubmit={handleUpdateVariant}
        submitLabel="Update Variant"
        loading={saving}
      />
    </div>
  );
}
