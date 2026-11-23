// Owner: Member 02
import { useState } from "react";

export default function TableList({ tables, selected, onSelect }) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const visible = tables.filter((t) => !q || t.table_name.toLowerCase().includes(q));

  return (
    <div className="table-list">
      <input
        type="search" placeholder="Search tables" aria-label="Search tables"
        value={search} onChange={(e) => setSearch(e.target.value)}
      />
      <ul>
        {visible.map((t) => (
          <li key={t.table_name}>
            <button
              type="button"
              className={"table-list-item" + (t.table_name === selected ? " active" : "")}
              onClick={() => onSelect(t.table_name)}
            >
              <span>{t.table_name}</span>
              <span className="muted">{t.columns.length}</span>
            </button>
          </li>
        ))}
        {visible.length === 0 && <li className="muted table-list-empty">No tables match.</li>}
      </ul>
    </div>
  );
}
