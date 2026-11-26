// Owner: Member 02
// Draws every table as a box and every foreign key as a line, using plain SVG (no extra library).
// Tables that reference nothing sit on the left; tables that reference them sit further right.
import { useMemo } from "react";

const BOX_W = 220;
const HEADER_H = 30;
const ROW_H = 22;
const BOX_PAD = 8;
const GAP_X = 120;
const GAP_Y = 28;
const MARGIN = 24;

function columnsToShow(table, showAll) {
  return showAll ? table.columns : table.columns.filter((c) => c.is_primary_key || c.is_foreign_key);
}

function computeLayout(tables, relationships, showAll) {
  const names = tables.map((t) => t.table_name);
  const known = new Set(names);
  const links = relationships.filter(
    (r) => known.has(r.table_name) && known.has(r.referenced_table) && r.table_name !== r.referenced_table
  );

  // Level = how many tables deep a table depends on (capped, so cycles cannot loop forever).
  const level = Object.fromEntries(names.map((n) => [n, 0]));
  for (let i = 0; i < names.length; i++) {
    let changed = false;
    for (const r of links) {
      const next = Math.min(level[r.referenced_table] + 1, names.length);
      if (level[r.table_name] < next) { level[r.table_name] = next; changed = true; }
    }
    if (!changed) break;
  }

  const byName = Object.fromEntries(tables.map((t) => [t.table_name, t]));
  const maxLevel = Math.max(0, ...Object.values(level));
  const boxes = {};
  let height = 0;

  for (let l = 0; l <= maxLevel; l++) {
    const inLevel = names.filter((n) => level[n] === l);
    // Order by the average height of the tables they point to, which keeps lines short.
    const score = (n) => {
      const ys = links.filter((r) => r.table_name === n && boxes[r.referenced_table]).map((r) => boxes[r.referenced_table].cy);
      return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : Infinity;
    };
    inLevel.sort((a, b) => {
      const sa = score(a), sb = score(b);
      if (sa === sb) return a.localeCompare(b);
      return sa - sb;
    });

    let y = MARGIN;
    for (const n of inLevel) {
      const cols = columnsToShow(byName[n], showAll);
      const h = HEADER_H + Math.max(cols.length, 1) * ROW_H + BOX_PAD;
      const x = MARGIN + l * (BOX_W + GAP_X);
      boxes[n] = { name: n, x, y, h, cols, level: l, cy: y + h / 2 };
      y += h + GAP_Y;
    }
    height = Math.max(height, y);
  }

  const width = MARGIN * 2 + (maxLevel + 1) * BOX_W + maxLevel * GAP_X;
  return { boxes, links, width, height: height + MARGIN - GAP_Y };
}

function anchorY(box, columnName) {
  const i = box.cols.findIndex((c) => c.column_name === columnName);
  return i === -1 ? box.y + HEADER_H / 2 : box.y + HEADER_H + i * ROW_H + ROW_H / 2;
}

function linePath(parent, child, rel) {
  const y1 = anchorY(parent, rel.referenced_column);
  const y2 = anchorY(child, rel.column_name);
  if (child.x > parent.x) {
    const x1 = parent.x + BOX_W;
    const x2 = child.x;
    const mid = (x1 + x2) / 2;
    return { d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 };
  }
  // Same column or backwards (only when tables reference each other in a loop): go around the right side.
  const x1 = parent.x + BOX_W;
  const x2 = child.x + BOX_W;
  const out = Math.max(x1, x2) + 40;
  return { d: `M ${x1} ${y1} C ${out} ${y1}, ${out} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 };
}

export default function ErdDiagram({ tables, relationships, selected, onSelect, showAll = false, zoom = 1 }) {
  const layout = useMemo(() => computeLayout(tables, relationships, showAll), [tables, relationships, showAll]);
  const { boxes, links, width, height } = layout;

  if (tables.length === 0) return <p className="muted">No tables to draw.</p>;

  const isLinked = (r) => selected && (r.table_name === selected || r.referenced_table === selected);

  return (
    <div className="erd-scroll">
      <svg
        className="erd" role="img" aria-label="Entity relationship diagram"
        width={width * zoom} height={height * zoom} viewBox={`0 0 ${width} ${height}`}
      >
        <g>
          {links.map((r, i) => {
            const p = linePath(boxes[r.referenced_table], boxes[r.table_name], r);
            const cls = "erd-line" + (isLinked(r) ? " linked" : selected ? " dim" : "");
            return (
              <g key={`${r.constraint_name}-${r.column_name}-${i}`} className={cls}>
                <title>{`${r.table_name}.${r.column_name} references ${r.referenced_table}.${r.referenced_column}`}</title>
                <path d={p.d} fill="none" />
                <circle cx={p.x1} cy={p.y1} r="3" />
                <circle cx={p.x2} cy={p.y2} r="3" />
              </g>
            );
          })}
        </g>

        {Object.values(boxes).map((b) => {
          const linkedTable = selected && links.some((r) => isLinked(r) && (r.table_name === b.name || r.referenced_table === b.name));
          const cls = "erd-box" + (b.name === selected ? " selected" : linkedTable ? " linked" : selected ? " dim" : "");
          return (
            <g key={b.name} className={cls} onClick={() => onSelect(b.name === selected ? null : b.name)} style={{ cursor: "pointer" }}>
              <rect className="erd-body" x={b.x} y={b.y} width={BOX_W} height={b.h} rx="6" />
              <path className="erd-head" d={`M ${b.x} ${b.y + HEADER_H} V ${b.y + 6} Q ${b.x} ${b.y} ${b.x + 6} ${b.y} H ${b.x + BOX_W - 6} Q ${b.x + BOX_W} ${b.y} ${b.x + BOX_W} ${b.y + 6} V ${b.y + HEADER_H} Z`} />
              <text className="erd-title" x={b.x + 12} y={b.y + 20}>{b.name}</text>
              {b.cols.map((c, i) => (
                <g key={c.column_name}>
                  <text className="erd-col" x={b.x + 12} y={b.y + HEADER_H + i * ROW_H + 15}>{c.column_name}</text>
                  <text className="erd-tag" x={b.x + BOX_W - 10} y={b.y + HEADER_H + i * ROW_H + 15} textAnchor="end">
                    {[c.is_primary_key && "PK", c.is_foreign_key && "FK"].filter(Boolean).join(" ")}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
