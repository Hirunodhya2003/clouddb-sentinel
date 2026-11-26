import React, { useEffect, useState } from "react";
import inventoryService from "../../services/inventoryService";

export default function LowStockItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLowStock() {
    setLoading(true);
    setError("");

    try {
      const data = await inventoryService.getLowStock();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load low-stock items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLowStock();
  }, []);

  return (
    <div style={{ padding: "24px", color: "#292524" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <h1>Low Stock Items</h1>
          <p style={{ color: "#78716c" }}>
            Items that need replenishment.
          </p>
        </div>

        <button onClick={loadLowStock} disabled={loading}>
          Refresh
        </button>
      </div>

      <div style={{
        background: "#fff7ed",
        border: "1px solid #fed7aa",
        borderRadius: "10px",
        padding: "18px",
        margin: "20px 0",
      }}>
        <span style={{ color: "#9a3412" }}>Items requiring attention</span>
        <h2 style={{ color: "#c2410c", marginBottom: 0 }}>
          {items.length}
        </h2>
      </div>

      {loading && <p>Loading low-stock items...</p>}

      {error && (
        <p style={{ color: "#dc2626" }}>{error}</p>
      )}

      {!loading && !error && (
        <div style={{
          overflowX: "auto",
          background: "#fff",
          border: "1px solid #e7e5e4",
          borderRadius: "10px",
          padding: "16px",
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
          }}>
            <thead>
              <tr style={{ background: "#f5f5f4" }}>
                {[
                  "Inventory ID",
                  "Variant ID",
                  "Available Quantity",
                  "Reorder Level",
                  "Shortage",
                  "Last Updated",
                ].map((heading) => (
                  <th key={heading} style={cellStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" style={cellStyle}>
                    No low-stock items found. Inventory levels look good!
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.inventory_id}>
                    <td style={cellStyle}>{item.inventory_id}</td>
                    <td style={cellStyle}>{item.variant_id}</td>
                    <td style={{ ...cellStyle, color: "#dc2626", fontWeight: 600 }}>
                      {item.quantity_on_hand}
                    </td>
                    <td style={cellStyle}>{item.reorder_level}</td>
                    <td style={cellStyle}>
                      {Math.max(
                        0,
                        item.reorder_level - item.quantity_on_hand
                      )}
                    </td>
                    <td style={cellStyle}>
                      {item.last_stock_updated
                        ? new Date(item.last_stock_updated).toLocaleString()
                        : "-"}
                    </td>
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

const cellStyle = {
  padding: "13px",
  textAlign: "left",
  borderBottom: "1px solid #e7e5e4",
};
