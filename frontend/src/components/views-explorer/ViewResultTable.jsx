
function formatValue(key, value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (key === "is_active") {
    return value ? "Active" : "Inactive";
  }

  if (
    [
      "cost_price",
      "selling_price",
      "profit_amount",
      "profit_margin_percentage",
    ].includes(key)
  ) {
    return Number(value).toFixed(2);
  }

  return value;
}

export default function ViewResultTable({
  selectedView,
  data = [],
  loading = false,
  error = "",
}) {
  if (loading) {
    return <p>Loading view data...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return <p>No data available in this database view.</p>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div>
      <h2>
        {selectedView === "products"
          ? "Product Summary Results"
          : "Variant Details Results"}
      </h2>

      <p>Total Records: {data.length}</p>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>
                  {column.replaceAll("_", " ").toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={row.variant_id ?? row.product_id ?? rowIndex}>
                {columns.map((column) => (
                  <td key={column}>
                    {formatValue(column, row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
