import React, { useEffect, useState } from "react";
import inventoryService from "../../services/inventoryService";

export default function InventoryHistory() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await inventoryService.getMovements();
        setMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load stock movement history.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const cell = {
    padding: "13px",
    borderBottom: "1px solid #e7e5e4",
    textAlign: "left",
  };

  return (
    <div style={{ padding: "24px", color: "#292524" }}>
      <h1>Inventory History</h1>
      <p style={{ color: "#78716c" }}>
        Track stock movements and inventory changes.
      </p>

      {loading && <p>Loading stock history...</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading && !error && (
        <div style={{
          overflowX: "auto",
          background: "#fff",
          border: "1px solid #e7e5e4",
          borderRadius: "10px",
          padding: "15px",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f4" }}>
                {["Movement ID", "Variant ID", "Movement Type", "Quantity", "Reference", "Date", "Notes"].map((heading) => (
                  <th key={heading} style={cell}>{heading}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="7" style={cell}>No stock movements found.</td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.movement_id}>
                    <td style={cell}>{movement.movement_id}</td>
                    <td style={cell}>{movement.variant_id}</td>
                    <td style={cell}>{movement.movement_type}</td>
                    <td style={cell}>{movement.quantity}</td>
                    <td style={cell}>
                      {movement.reference_type || "-"} #{movement.reference_id || "-"}
                    </td>
                    <td style={cell}>
                      {movement.movement_date
                        ? new Date(movement.movement_date).toLocaleString()
                        : "-"}
                    </td>
                    <td style={cell}>{movement.notes || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
