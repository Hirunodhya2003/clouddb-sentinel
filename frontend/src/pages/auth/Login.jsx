import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("permissions", JSON.stringify([
      "user:read", "user:create", "user:update", "user:delete",
      "role:read", "role:update", "dashboard:read",
    ]));
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>CloudDB Sentinel</h1>
        <p className="card-sub">Sign in to continue</p>
        {error && <div className="alert-error">{error}</div>}
        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn-primary" type="submit">Sign in</button>
      </form>
    </main>
  );
}
