// Owner: Member 02
import { useEffect, useMemo, useState } from "react";
import TableList from "../../components/schema-viewer/TableList.jsx";
import ErdDiagram from "../../components/schema-viewer/ErdDiagram.jsx";
import schemaViewerService from "../../services/schemaViewerService.js";

// Display helpers: hide collation noise and shorten the long auto-update default.
const cleanType = (t) => t.replace(/\s+COLLATE\s+\S+/i, "");
const cleanDefault = (d) => (d == null ? "-" : d.replace(/\s+ON UPDATE\s+.*/i, " (auto-updates)"));

export default function SchemaViewer() {
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("tables");
  const [selected, setSelected] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    Promise.all([schemaViewerService.tables(), schemaViewerService.relationships()])
      .then(([t, r]) => {
        setTables(t);
        setRelationships(r);
        setSelected(t[0]?.table_name ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const table = useMemo(() => tables.find((t) => t.table_name === selected) || null, [tables, selected]);
  const references = relationships.filter((r) => r.table_name === selected);
  const referencedBy = relationships.filter((r) => r.referenced_table === selected);

  return (
    <>
      <div className="page-header">
        <h1>Schema viewer</h1>
        <p>Browse the database tables, their columns and how they are related.</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {loading && <p className="muted">Loading schema...</p>}

      {!loading && !error && (
        <>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "tables"} className={"tab" + (tab === "tables" ? " active" : "")} onClick={() => setTab("tables")}>
              Tables ({tables.length})
            </button>
            <button type="button" role="tab" aria-selected={tab === "erd"} className={"tab" + (tab === "erd" ? " active" : "")} onClick={() => setTab("erd")}>
              ER diagram
            </button>
          </div>

          {tab === "tables" ? (
            <div className="schema-layout">
              <div className="card"><TableList tables={tables} selected={selected} onSelect={setSelected} /></div>

              <div className="card">
                {!table ? (
                  <p className="muted">Select a table to see its columns.</p>
                ) : (
                  <>
                    <h2 className="form-title">{table.table_name}</h2>
                    <p className="muted">{table.columns.length} columns. Primary key: {table.primary_key.join(", ") || "none"}.</p>

                    <div className="table-wrap">
                      <table className="table schema-table">
                        <thead>
                          <tr><th>Column</th><th>Type</th><th>Nullable</th><th>Keys</th><th>Default</th></tr>
                        </thead>
                        <tbody>
                          {table.columns.map((c) => (
                            <tr key={c.column_name}>
                              <td className="mono">{c.column_name}</td>
                              <td className="mono muted">{cleanType(c.data_type)}{c.auto_increment ? " AUTO_INCREMENT" : ""}</td>
                              <td className="muted">{c.nullable ? "Yes" : "No"}</td>
                              <td>
                                {c.is_primary_key && <span className="key-tag key-pk">PK</span>}
                                {c.is_foreign_key && <span className="key-tag key-fk">FK</span>}
                                {c.is_unique && <span className="key-tag key-uq">UQ</span>}
                              </td>
                              <td className="mono muted">{cleanDefault(c.default)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <h3 className="sub-title">References</h3>
                    {references.length === 0 ? <p className="muted">This table has no foreign keys.</p> : (
                      <ul className="rel-list">
                        {references.map((r, i) => (
                          <li key={i}>
                            <span className="mono">{r.column_name}</span> to{" "}
                            <button type="button" className="link-btn" onClick={() => setSelected(r.referenced_table)}>{r.referenced_table}</button>
                            <span className="mono">.{r.referenced_column}</span>
                            <span className="muted"> (on delete {r.on_delete || "default"})</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <h3 className="sub-title">Referenced by</h3>
                    {referencedBy.length === 0 ? <p className="muted">No other table references this one.</p> : (
                      <ul className="rel-list">
                        {referencedBy.map((r, i) => (
                          <li key={i}>
                            <button type="button" className="link-btn" onClick={() => setSelected(r.table_name)}>{r.table_name}</button>
                            <span className="mono">.{r.column_name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="toolbar erd-toolbar">
                <label className="inline-check">
                  <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show all columns
                </label>
                <label className="inline-check">
                  Zoom
                  <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom">
                    <option value={0.5}>50%</option>
                    <option value={0.75}>75%</option>
                    <option value={1}>100%</option>
                    <option value={1.25}>125%</option>
                  </select>
                </label>
                <span className="muted">PK primary key, FK foreign key. Click a table to highlight its links.</span>
              </div>
              <ErdDiagram tables={tables} relationships={relationships} selected={selected} onSelect={setSelected} showAll={showAll} zoom={zoom} />
            </div>
          )}
        </>
      )}
    </>
  );
}
