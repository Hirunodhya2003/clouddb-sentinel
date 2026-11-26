// Owner: Member 02
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="brand-mark">SP</div>
        <h1>Dressing the future with smarter operations.</h1>
        <p>A unified workspace for apparel inventory, purchasing, sales and reliable database operations.</p>
      </section>
      <section className="auth-panel">
        <Outlet />
      </section>
    </div>
  );
}
