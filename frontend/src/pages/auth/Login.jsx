import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/sentinel-login.css";

const DEMO_PERMISSIONS = [
  "user:read",
  "user:create",
  "user:update",
  "user:delete",
  "role:read",
  "role:update",
  "dashboard:read",
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    localStorage.setItem("token", "demo-token");
    localStorage.setItem("permissions", JSON.stringify(DEMO_PERMISSIONS));
    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="sentinel-login">
      <section className="sentinel-login-brand" aria-labelledby="login-brand">
        <span className="sentinel-login-mark" aria-hidden="true">
          CD
        </span>

        <div className="sentinel-login-brand-copy">
          <p>S.P. Apparels</p>
          <h1 id="login-brand">CloudDB Sentinel</h1>
          <p>Database administration workspace</p>
        </div>
      </section>

      <div className="sentinel-login-body">
        <form
          className="sentinel-login-form"
          onSubmit={submit}
          aria-labelledby="login-title"
        >
          <header>
            <h2 id="login-title">Sign in</h2>
            <p>Use your workspace email and password.</p>
          </header>

          {error && (
            <p className="sentinel-login-error" role="alert">
              {error}
            </p>
          )}

          <label>
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit">Sign in</button>

          <Link className="sentinel-signup-button" to="/signup">
            Sign up
          </Link>
        </form>
      </div>
    </main>
  );
}