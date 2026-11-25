import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchRoles, fetchPermissions, saveRolePermissions } from "../../api/rolesApi";

const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const toMap = (roles) => Object.fromEntries(roles.map((r) => [r.id, new Set(r.permissions)]));

export default function RolesPage() {
  const { can } = useAuth();
  const canEdit = can("role:update");

  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);
  const [draft, setDraft] = useState({});     // what the checkboxes currently show
  const [original, setOriginal] = useState({}); // what is saved
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [r, p] = await Promise.all([fetchRoles(), fetchPermissions()]);
        setRoles(r);
        setPerms(p);
        setDraft(toMap(r));
        setOriginal(toMap(r));
      } catch {
        setError("Could not load roles and permissions.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (roleId, code) => {
    setMessage("");
    setDraft((d) => {
      const s = new Set(d[roleId]);
      s.has(code) ? s.delete(code) : s.add(code);
      return { ...d, [roleId]: s };
    });
  };

  const changed = roles.filter((r) => draft[r.id] && !same(draft[r.id], original[r.id]));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      for (const r of changed) await saveRolePermissions(r.id, [...draft[r.id]]);
      setOriginal(Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, new Set(v)])));
      setMessage("Permissions saved.");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const modules = [...new Set(perms.map((p) => p.code.split(":")[0]))];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Role &amp; Permissions</h1>
          <p>Define access by role and manage permissions</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={save} disabled={saving || changed.length === 0}>
            {saving ? "Saving…" : changed.length ? `Save changes (${changed.length})` : "Save changes"}
          </button>
        )}
      </div>

      <section className="card">
        <h3>Role permission matrix</h3>
        <p className="card-sub">
          Tick what each role can do. {canEdit ? "The Admin role is locked." : "You have read-only access."}
        </p>

        {error && <div className="alert-error">{error}</div>}
        {message && <div className="alert-success">{message}</div>}

        {loading ? (
          <p className="card-sub">Loading…</p>
        ) : (
          <div className="matrix-wrap">
            <table className="matrix">
              <thead>
                <tr>
                  <th>Permission</th>
                  {roles.map((r) => <th key={r.id}>{r.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <MatrixModule
                    key={m}
                    module={m}
                    perms={perms.filter((p) => p.code.startsWith(`${m}:`))}
                    roles={roles}
                    draft={draft}
                    canEdit={canEdit}
                    toggle={toggle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MatrixModule({ module, perms, roles, draft, canEdit, toggle }) {
  return (
    <>
      <tr className="module-row"><td colSpan={roles.length + 1}>{module}</td></tr>
      {perms.map((p) => (
        <tr key={p.code}>
          <td>{p.code}</td>
          {roles.map((r) => (
            <td key={r.id}>
              <input
                type="checkbox"
                checked={draft[r.id]?.has(p.code) ?? false}
                disabled={!canEdit || r.name === "Admin"}
                onChange={() => toggle(r.id, p.code)}
                aria-label={`${r.name} ${p.code}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}