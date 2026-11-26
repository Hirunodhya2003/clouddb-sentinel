// Owner: Member 02
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "../../components/products/ProductForm.jsx";
import productService from "../../services/productService.js";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError("");
    try {
      await productService.create(payload);
      navigate("/products");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Create product</h1>
        <p>Add a new product to the catalogue.</p>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <ProductForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Create product" onCancel={() => navigate("/products")} />
    </>
  );
}
