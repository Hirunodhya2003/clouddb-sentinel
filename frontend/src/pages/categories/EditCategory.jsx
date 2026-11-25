// Owner: Member 02
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CategoryForm from "../../components/categories/CategoryForm.jsx";
import categoryService from "../../services/categoryService.js";

export default function EditCategory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    categoryService.get(id).then(setCategory).catch((err) => setError(err.message));
  }, [id]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError("");
    try {
      await categoryService.update(id, payload);
      navigate("/categories");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Edit category</h1>
        <p>Update the category details.</p>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {category ? (
        <CategoryForm initial={category} onSubmit={handleSubmit} submitting={submitting} onCancel={() => navigate("/categories")} />
      ) : (
        !error && <p className="muted">Loading category...</p>
      )}
    </>
  );
}
