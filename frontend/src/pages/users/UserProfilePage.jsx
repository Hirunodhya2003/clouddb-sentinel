import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchUser } from "../../api/usersApi";
import { fetchRoles } from "../../api/rolesApi";

export default function UserProfilePage() {
  const { id } = useParams();
  const { can } = useAuth();
  const [user, setUser] = useState(null);
  const [perms, setPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const u = await fetchUser(id);
        setUser(u);
        try {
          const roles = await fetchRoles();
          setPerms(roles.find((r) => r.name === u.role)?.permissions ?? []);
        } catch {
          setPerms([]); // some users can't read roles; the profile still works
        }
      } catch (err) {
        setError(err.response?.status === 404 ? "User not found." : "Could not load this user.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (error)
    return (
      <div>
        <div className="alert-error">{error}</div>
        <Link to="/users" className="btn-ghost">Back to users</Link>
      </div>
    );

  const initials = user.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const grouped = perms.reduce((acc, code) => {
    const [module, action] = code.split(":");
    (acc[module] ||= []).push(action);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Profile</h1>
          <p>Account information and access permissions</p>
        </div>
        <div className="header-actions">
          <Link to="/users" className="btn-ghost">Back</Link>
          {can("user:update") && <Link to={`/users/${user.id}/edit`} className="btn-primary">Edit user</Link>}
        </div>
      </div>

      <div className="profile-grid">
        <section className="card">
          <div className="profile-head">
            <div className="avatar">{initials}</div>
            <div>
              <h3>{user.full_name}</h3>
              <span className={`badge ${user.is_active ? "badge-green" : "badge-grey"}`}>
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <dl className="detail-list">
            <dt>User ID</dt><dd>#{user.id}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Role</dt><dd><span className="badge badge-blue">{user.role}</span></dd>
            <dt>Last login</dt><dd>{user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}</dd>
          </dl>
        </section>

        <section className="card">
          <h3>Access &amp; permissions</h3>
          <p className="card-sub">What the {user.role} role is allowed to do</p>
          {Object.keys(grouped).length === 0 ? (
            <p className="card-sub">Permission details are not available.</p>
          ) : (
            Object.entries(grouped).map(([module, actions]) => (
              <div className="perm-row" key={module}>
                <strong>{module}</strong>
                {actions.map((a) => <span key={a} className="badge badge-blue">{a}</span>)}
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}