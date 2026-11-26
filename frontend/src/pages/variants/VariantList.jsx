import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import VariantTable from "../../components/variants/VariantTable";

import {
  getAllVariants,
  deleteVariant,
} from "../../services/variantService";

export default function VariantList() {
  const navigate = useNavigate();

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVariants() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllVariants();
      setVariants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load variants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVariants();
  }, []);

  function handleView(variant) {
    navigate(`/variants/${variant.variant_id}`);
  }

  function handleEdit(variant) {
    navigate(`/variants/edit/${variant.variant_id}`);
  }

  async function handleDelete(variantId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this variant?"
    );

    if (!confirmed) return;

    try {
      await deleteVariant(variantId);
      alert("Variant deleted successfully!");
      await loadVariants();
    } catch (err) {
      setError(err.message || "Failed to delete variant");
    }
  }

  if (loading) {
    return <p>Loading variants...</p>;
  }

  return (
    <div>
      <h1>Product Variants</h1>

      {error && <p role="alert">{error}</p>}

      <button
        type="button"
        onClick={() => navigate("/variants/create")}
      >
        Create New Variant
      </button>

      <VariantTable
        variants={variants}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}