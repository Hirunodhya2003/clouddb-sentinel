
import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function ColorSelector({
  value,
  onChange,
  disabled = false,
}) {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchColors() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/colors/`);

        if (!response.ok) {
          throw new Error("Failed to load colours");
        }

        const data = await response.json();
        setColors(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        setError(err.message || "Unable to load colours");
      } finally {
        setLoading(false);
      }
    }

    fetchColors();
  }, []);

  if (loading) {
    return <p>Loading colours...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div>
      <label htmlFor="colour_id">Select Colour</label>

      <select
        id="colour_id"
        value={value ?? ""}
        onChange={(event) => onChange?.(Number(event.target.value))}
        disabled={disabled}
        required
      >
        <option value="">Choose a colour</option>

        {colors.map((color) => (
          <option key={color.colour_id} value={color.colour_id}>
            {color.colour_name}
          </option>
        ))}
      </select>
    </div>
  );
}
