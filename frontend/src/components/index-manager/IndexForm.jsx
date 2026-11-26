import React, { useState } from "react";

const TABLES = [
  "inventory",
  "stock_movements",
  "stock_adjustments",
  "stock_adjustment_items",
  "product_variants",
];

export default function IndexForm({ onSubmit, loading = false }) {
  const [tableName, setTableName] = useState("inventory");
  const [indexName, setIndexName] = useState("");
  const [columns, setColumns] = useState("");
  const [isUnique, setIsUnique] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      table_name: tableName,
      index_name: indexName.trim(),
      columns: columns.split(",").map((column) => column.trim()),
      is_unique: isUnique,
    });

    setIndexName("");
    setColumns("");
    setIsUnique(false);
  }

  const inputStyle = {
    width: "100%",
    padding: "11px",
    border: "1px solid #d6d3d1",
    borderRadius: "7px",
    boxSizing: "border-box",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        border: "1px solid #e7e5e4",
        borderRadius: "10px",
        padding: "20px",
      }}
    >
      <h3>Create Database Index</h3>

      <div style={{ marginBottom: "15px" }}>
        <label>Table Name</label>
        <select
          style={inputStyle}
          value={tableName}
          onChange={(event) => setTableName(event.target.value)}
        >
          {TABLES.map((table) => (
            <option key={table} value={table}>{table}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Index Name</label>
        <input
          style={inputStyle}
          value={indexName}
          onChange={(event) => setIndexName(event.target.value)}
          placeholder="e.g. idx_inventory_variant"
          pattern="[A-Za-z][A-Za-z0-9_]{0,63}"
          title="Start with a letter and use only letters, numbers and underscores."
          required
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Columns (comma-separated)</label>
        <input
          style={inputStyle}
          value={columns}
          onChange={(event) => setColumns(event.target.value)}
          placeholder="e.g. variant_id, quantity_on_hand"
          required
        />
      </div>

      <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={isUnique}
          onChange={(event) => setIsUnique(event.target.checked)}
        />
        Create unique index
      </label>

      <button
        type="submit"
        disabled={loading || !indexName.trim() || !columns.trim()}
        style={{
          marginTop: "18px",
          padding: "11px 18px",
          border: 0,
          borderRadius: "7px",
          background: "#4b3f3a",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {loading ? "Creating..." : "Create Index"}
      </button>
    </form>
  );
}
