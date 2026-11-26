// Owner: Member 02
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductForm from "../../components/products/ProductForm.jsx";
import productService from "../../services/productService.js";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    productService.get(id).then(setProduct).catch((err) => setError(err.message));
  }, [id]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError("");
    try {
      await productService.update(id, payload);
      navigate(`/products/${id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Edit product</h1>
        <p>Update product information.</p>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {product ? (
        <ProductForm initial={product} onSubmit={handleSubmit} submitting={submitting} onCancel={() => navigate(`/products/${id}`)} />
      ) : (
        !error && <p className="muted">Loading product...</p>
      )}
    </>
  );
}
