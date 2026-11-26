
import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function SizeSelector({ value, onChange, disabled = false }) {
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSizes() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/sizes/`);

        if (!response.ok) {
          throw new Error("Failed to load sizes");
        }

        const data = await response.json();
        setSizes(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        setError(err.message || "Unable to load sizes");
      } finally {
        setLoading(false);
      }
    }

    fetchSizes();
  }, []);

  if (loading) {
    return <p>Loading sizes...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div>
      <label htmlFor="size_id">Select Size</label>

      <select
        id="size_id"
        value={value ?? ""}
        onChange={(event) => onChange?.(Number(event.target.value))}
        disabled={disabled}
        required
      >
        <option value="">Choose a size</option>

        {sizes.map((size) => (
          <option key={size.size_id} value={size.size_id}>
            {size.size_name}
          </option>
        ))}
      </select>
    </div>
  );
}
