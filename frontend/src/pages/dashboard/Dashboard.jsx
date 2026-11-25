export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>CloudDB Sentinel overview</p>
        </div>
      </div>
      <div className="summary-grid">
        <section className="card"><h3>Users</h3><strong>5</strong></section>
        <section className="card"><h3>Roles</h3><strong>5</strong></section>
        <section className="card"><h3>System status</h3><strong>Online</strong></section>
      </div>
    </div>
  );
}
