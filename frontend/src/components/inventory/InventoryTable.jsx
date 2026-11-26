import React from "react";

export default function InventoryTable({ inventory = [], loading = false }) {
  if (loading) {
    return <p>Loading inventory...</p>;
  }

  if (!inventory.length) {
    return <p>No inventory records found.</p>;
  }

  const cellStyle = {
    padding: "14px",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            {["Inventory ID", "Variant ID", "Quantity", "Reorder Level", "Status", "Last Updated"].map(
              (heading) => (
                <th key={heading} style={cellStyle}>{heading}</th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {inventory.map((item) => {
            const lowStock = item.quantity_on_hand <= item.reorder_level;

            return (
              <tr key={item.inventory_id}>
                <td style={cellStyle}>{item.inventory_id}</td>
                <td style={cellStyle}>{item.variant_id}</td>
                <td style={cellStyle}>{item.quantity_on_hand}</td>
                <td style={cellStyle}>{item.reorder_level}</td>
                <td style={cellStyle}>
                  <span
                    style={{
                      padding: "5px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: lowStock ? "#991b1b" : "#166534",
                      background: lowStock ? "#fee2e2" : "#dcfce7",
                    }}
                  >
                    {lowStock ? "Low Stock" : "In Stock"}
                  </span>
                </td>
                <td style={cellStyle}>
                  {item.last_stock_updated
                    ? new Date(item.last_stock_updated).toLocaleString()
                    : "N/A"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
