import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/sentinel-users.css";

const apiBase = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "").replace(/\/api\/v1$/, "");

export default function UserList() {
  const { can } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setStatus("loading");
      setError("");

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiBase}/api/v1/users`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.status === 401) {
          throw new Error("The API rejected your session. The demo sign-in cannot authenticate with FastAPI.");
        }
        if (response.status === 403) {
          throw new Error("Your account does not have permission to view users.");
        }
        if (response.status === 404) {
          throw new Error("FastAPI does not have a user-list endpoint at /api/v1/users.");
        }
        if (!response.ok) {
          throw new Error(`The user list could not be loaded (${response.status}).`);
        }

        const data = await response.json();
        const rows = Array.isArray(data) ? data : data.items;

        if (!Array.isArray(rows)) {
          throw new Error("The API returned an unexpected user-list format.");
        }

        if (!controller.signal.aborted) {
          setUsers(rows);
          setStatus("ready");
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof TypeError
            ? "Could not reach FastAPI. Check that the server is running and the frontend API URL is correct."
            : err.message,
        );
        setStatus("error");
      }
    }

    loadUsers();
    return () => controller.abort();
  }, [reload]);

  const query = search.trim().toLowerCase();
  const visibleUsers = users.filter((user) =>
    [user.first_name, user.last_name, user.username, user.email, user.employee_code]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  );

  return (
    <section className="sentinel-users" aria-labelledby="users-title">
      <header className="sentinel-users-header">
        <div>
          <h1 id="users-title">Users</h1>
          <p>Find workspace accounts and manage their access.</p>
        </div>

        {can("user:create") && (
          <Link className="sentinel-users-create" to="/users/new">
            Create user
          </Link>
        )}
      </header>

      <div className="sentinel-users-card">
        <div className="sentinel-users-toolbar">
          <label>
            <span>Search users</span>
            <input
              type="search"
              placeholder="Name, email, or employee code"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          {status === "ready" && (
            <p role="status">
              {visibleUsers.length} of {users.length} users
            </p>
          )}
        </div>

        {status === "loading" && (
          <p className="sentinel-users-message" role="status">Loading users…</p>
        )}

        {status === "error" && (
          <div className="sentinel-users-message" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setReload((value) => value + 1)}>
              Try again
            </button>
          </div>
        )}

        {status === "ready" && visibleUsers.length === 0 && (
          <p className="sentinel-users-message">
            {query ? "No users match your search." : "No user accounts yet."}
          </p>
        )}

        {status === "ready" && visibleUsers.length > 0 && (
          <div className="sentinel-users-table-wrap">
            <table aria-label="Workspace users">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Employee code</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleUsers.map((user) => {
                  const id = user.user_id ?? user.id;
                  const name = [user.first_name, user.last_name]
                    .filter(Boolean)
                    .join(" ") || user.username || user.email;

                  const accountStatus =
                    user.is_active == null ? "Unknown" : user.is_active ? "Active" : "Inactive";

                  return (
                    <tr key={id ?? user.email}>
                      <td>
                        <strong>{name}</strong>
                        <span className="sentinel-users-email">{user.email}</span>
                      </td>
                      <td>{user.employee_code || "—"}</td>
                      <td>{user.role_name || (user.role_id != null ? `Role ${user.role_id}` : "—")}</td>
                      <td>
                        <span className="sentinel-users-status" data-status={accountStatus}>
                          {accountStatus}
                        </span>
                      </td>
                      <td>
                        {id != null && (
                          <div className="sentinel-users-actions">
                            <Link to={`/users/${id}`} aria-label={`View ${name}`}>View</Link>
                            {can("user:update") && (
                              <Link to={`/users/${id}/edit`} aria-label={`Edit ${name}`}>Edit</Link>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}