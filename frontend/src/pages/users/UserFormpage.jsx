import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchUser, createUser, updateUser } from "../../api/usersApi";
import { fetchRoles } from "../../api/rolesApi";

function Field({ label, error, hint, children }) {
  return (
    <label className={`field ${error ? "has-error" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "", is_active: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const roleList = await fetchRoles();
        setRoles(roleList);
        if (isEdit) {
          const u = await fetchUser(id);
          setForm({ full_name: u.full_name, email: u.email, password: "", role: u.role, is_active: u.is_active });
        } else {
          const def = roleList.find((r) => r.name === "Viewer") || roleList[0];
          setForm((f) => ({ ...f, role: def?.name || "" }));
        }
      } catch {
        setError("Could not load the form. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.full_name.trim().length < 2) e.full_name = "Enter the full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email address.";
    if (!isEdit && form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (isEdit && form.password && form.password.length < 8) e.password = "Use at least 8 characters, or leave blank.";
    if (!form.role) e.role = "Choose a role.";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        is_active: form.is_active,
      };
      if (form.password) payload.password = form.password;
      if (isEdit) await updateUser(id, payload);
      else await createUser(payload);
      navigate("/users");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Please check the form fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? "Edit User" : "Create User"}</h1>
          <p>{isEdit ? "Update account details and access role" : "Create a new user and assign an access role"}</p>
        </div>
        <div className="header-actions">
          <Link to="/users" className="btn-ghost">Cancel</Link>
          <button type="submit" form="user-form" className="btn-primary" disabled={saving || loading}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <form id="user-form" className="card form-card" onSubmit={handleSubmit} noValidate>
        <h3>Basic information</h3>
        <p className="card-sub">Complete the information below. Fields marked required must be provided.</p>
        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <p className="card-sub">Loading…</p>
        ) : (
          <div className="form-grid">
            <Field label="Full name (required)" error={fieldErrors.full_name}>
              <input value={form.full_name} onChange={set("full_name")} placeholder="e.g. Nimal Perera" />
            </Field>

            <Field label="Email address (required)" error={fieldErrors.email}>
              <input type="email" value={form.email} onChange={set("email")} placeholder="name@spapparels.com" />
            </Field>

            <Field
              label={isEdit ? "New password" : "Password (required)"}
              error={fieldErrors.password}
              hint={isEdit ? "Leave blank to keep the current password." : "At least 8 characters."}
            >
              <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
            </Field>

            <Field label="Role (required)" error={fieldErrors.role}>
              <select value={form.role} onChange={set("role")}>
                <option value="">Select a role</option>
                {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={form.is_active ? "active" : "inactive"}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === "active" }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
        )}
        <p className="form-note">All changes are subject to validation and role permissions.</p>
      </form>
    </div>
  );
}