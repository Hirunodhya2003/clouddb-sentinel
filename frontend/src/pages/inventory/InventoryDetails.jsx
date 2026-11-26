import React, { useState } from "react";
import inventoryService from "../../services/inventoryService";

export default function InventoryDetails() {
  const [variantId, setVariantId] = useState("");
  const [inventory, setInventory] = useState(null);
  const [reorderLevel, setReorderLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function searchInventory(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setInventory(null);

    try {
      const result = await inventoryService.getByVariant(variantId);
      setInventory(result);
      setReorderLevel(result.reorder_level);
    } catch (err) {
      setError(err.message || "Inventory record not found.");
    } finally {
      setLoading(false);
    }
  }

  async function updateReorderLevel(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const result = await inventoryService.updateReorderLevel(
        variantId,
        Number(reorderLevel)
      );

      setInventory(result);
      setMessage("Reorder level updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update reorder level.");
    }
  }

  const card = {
    background: "#fff",
    border: "1px solid #e7e5e4",
    borderRadius: "10px",
    padding: "22px",
    marginTop: "20px",
  };

  const field = {
    padding: "10px",
    border: "1px solid #d6d3d1",
    borderRadius: "6px",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "24px", color: "#292524" }}>
      <h1>Inventory Details</h1>
      <p style={{ color: "#78716c" }}>
        Search and manage stock information for a product variant.
      </p>

      <form onSubmit={searchInventory} style={card}>
        <label>Variant ID</label>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <input
            style={field}
            type="number"
            min="1"
            required
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            placeholder="Enter variant ID"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {inventory && (
        <div style={card}>
          <h2>Stock Information</h2>
          <p><strong>Inventory ID:</strong> {inventory.inventory_id}</p>
          <p><strong>Variant ID:</strong> {inventory.variant_id}</p>
          <p><strong>Available Quantity:</strong> {inventory.quantity_on_hand}</p>
          <p><strong>Current Reorder Level:</strong> {inventory.reorder_level}</p>
          <p>
            <strong>Status:</strong>{" "}
            {inventory.quantity_on_hand <= inventory.reorder_level
              ? "Low Stock"
              : "In Stock"}
          </p>

          <hr style={{ border: 0, borderTop: "1px solid #e7e5e4" }} />

          <h3>Update Reorder Level</h3>

          <form onSubmit={updateReorderLevel}>
            <input
              style={field}
              type="number"
              min="0"
              required
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
            />

            <button type="submit" style={{ marginTop: "12px" }}>
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
