import React from "react";

export default function IndexTable({
  indexes = [],
  loading = false,
  onDelete,
}) {
  if (loading) return <p>Loading database indexes...</p>;

  const cellStyle = {
    padding: "13px",
    textAlign: "left",
    borderBottom: "1px solid #e7e5e4",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f4" }}>
            {["Table", "Index Name", "Column", "Unique", "Action"].map(
              (heading) => (
                <th key={heading} style={cellStyle}>{heading}</th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {indexes.length === 0 ? (
            <tr>
              <td colSpan="5" style={cellStyle}>No indexes found.</td>
            </tr>
          ) : (
            indexes.map((index, position) => (
              <tr key={`${index.table_name}-${index.index_name}-${position}`}>
                <td style={cellStyle}>{index.table_name}</td>
                <td style={cellStyle}>{index.index_name}</td>
                <td style={cellStyle}>{index.column_name || "-"}</td>
                <td style={cellStyle}>{index.non_unique === 0 ? "Yes" : "No"}</td>
                <td style={cellStyle}>
                  {index.index_name !== "PRIMARY" && (
                    <button
                      onClick={() => onDelete(index.table_name, index.index_name)}
                      style={{
                        padding: "7px 12px",
                        color: "#991b1b",
                        background: "#fee2e2",
                        border: 0,
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Drop
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
