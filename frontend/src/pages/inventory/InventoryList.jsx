import React, { useCallback, useEffect, useState } from "react";
import InventoryTable from "../../components/inventory/InventoryTable";
import inventoryService from "../../services/inventoryService";

export default function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = showLowStock
        ? await inventoryService.getLowStock()
        : await inventoryService.getAll();

      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [showLowStock]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const totalItems = inventory.length;
  const lowStockCount = inventory.filter(
    (item) => item.quantity_on_hand <= item.reorder_level
  ).length;

  const pageStyle = {
    padding: "24px",
    color: "#292524",
  };

  const buttonStyle = {
    padding: "10px 16px",
    border: "1px solid #d6d3d1",
    borderRadius: "7px",
    cursor: "pointer",
    background: "#fff",
    fontWeight: "600",
  };

  return (
    <div style={pageStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "28px" }}>Inventory Management</h1>
          <p style={{ color: "#78716c" }}>
            Monitor stock quantities and reorder levels.
          </p>
        </div>

        <button style={buttonStyle} onClick={loadInventory}>
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={statCardStyle}>
          <p style={statLabelStyle}>Inventory Records</p>
          <h2>{totalItems}</h2>
        </div>

        <div style={statCardStyle}>
          <p style={statLabelStyle}>Low Stock Records</p>
          <h2 style={{ color: "#dc2626" }}>{lowStockCount}</h2>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <button
          style={{
            ...buttonStyle,
            background: !showLowStock ? "#4b3f3a" : "#fff",
            color: !showLowStock ? "#fff" : "#292524",
          }}
          onClick={() => setShowLowStock(false)}
        >
          All Inventory
        </button>

        <button
          style={{
            ...buttonStyle,
            background: showLowStock ? "#4b3f3a" : "#fff",
            color: showLowStock ? "#fff" : "#292524",
          }}
          onClick={() => setShowLowStock(true)}
        >
          Low Stock Only
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "7px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #e7e5e4",
          borderRadius: "10px",
          padding: "16px",
          overflow: "hidden",
        }}
      >
        <InventoryTable inventory={inventory} loading={loading} />
      </div>
    </div>
  );
}

const statCardStyle = {
  background: "#fff",
  border: "1px solid #e7e5e4",
  borderRadius: "10px",
  padding: "18px",
};

const statLabelStyle = {
  color: "#78716c",
  margin: 0,
  fontSize: "14px",
};
