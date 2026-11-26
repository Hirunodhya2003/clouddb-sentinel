// Owner: Member 02
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CategoryForm from "../../components/categories/CategoryForm.jsx";
import categoryService from "../../services/categoryService.js";

export default function CreateCategory() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError("");
    try {
      await categoryService.create(payload);
      navigate("/categories");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>New category</h1>
        <p>Add a category to the product catalogue.</p>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <CategoryForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Create category" onCancel={() => navigate("/categories")} />
    </>
  );
}
