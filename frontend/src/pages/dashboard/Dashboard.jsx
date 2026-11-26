import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/dashboard.css";

const summary = [
  { label: "Users", value: "5", description: "Workspace accounts" },
  { label: "Roles", value: "5", description: "Access profiles" },
  { label: "System status", value: "Online", description: "Example service state" },
];

const actions = [
  {
    label: "Browse users",
    description: "Find accounts and open user profiles.",
    path: "/users",
    permission: "user:read",
  },
  {
    label: "Create user",
    description: "Open the new workspace account form.",
    path: "/users/new",
    permission: "user:create",
  },
  {
    label: "Roles & permissions",
    description: "Review what each workspace role can access.",
    path: "/roles",
    permission: "role:read",
  },
];

export default function Dashboard() {
  const { can } = useAuth();
  const availableActions = actions.filter(({ permission }) => can(permission));

  return (
    <div className="sentinel-dashboard">
      <header className="sentinel-dashboard-hero">
        <p>CloudDB Sentinel</p>
        <h1>Dashboard</h1>
        <p>Manage workspace accounts, roles, and permissions.</p>
      </header>

      <section aria-labelledby="dashboard-overview">
        <div className="sentinel-dashboard-section-heading">
          <h2 id="dashboard-overview">Workspace overview</h2>
          <span className="sentinel-dashboard-demo">Demo values</span>
        </div>

        <dl className="sentinel-dashboard-metrics">
          {summary.map(({ label, value, description }) => (
            <div className="sentinel-dashboard-metric" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
              <dd className="sentinel-dashboard-metric-note">{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      {availableActions.length > 0 && (
        <section aria-labelledby="dashboard-actions">
          <div className="sentinel-dashboard-section-heading">
            <h2 id="dashboard-actions">Quick actions</h2>
          </div>

          <div className="sentinel-dashboard-actions">
            {availableActions.map(({ label, description, path }) => (
              <Link className="sentinel-dashboard-action" to={path} key={path}>
                <span>
                  <strong>{label}</strong>
                  <span className="sentinel-dashboard-action-note">
                    {description}
                  </span>
                </span>
                <span className="sentinel-dashboard-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}