import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/sentinel-login.css";

export default function SignUp() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const password = form.get("password");

    if (password !== form.get("confirm_password")) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setStatus("submitting");

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.get("first_name").trim(),
          last_name: form.get("last_name").trim(),
          username: form.get("username").trim(),
          email: form.get("email").trim(),
          password,
        }),
      });

      const result = await response.json().catch(() => null);

      if (response.status === 404 || response.status === 405 || !result) {
        throw new Error("Registration is not available yet.");
      }

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Check your details and try again."
        );
      }

      setStatus("success");
    } catch (err) {
      setError(err.message || "Could not reach the server. Try again.");
      setStatus("idle");
    }
  }

  return (
    <main className="sentinel-login">
      <section className="sentinel-login-brand" aria-labelledby="signup-brand">
        <span className="sentinel-login-mark" aria-hidden="true">CD</span>
        <div className="sentinel-login-brand-copy">
          <p>S.P. Apparels</p>
          <h1 id="signup-brand">CloudDB Sentinel</h1>
          <p>Database administration workspace</p>
        </div>
      </section>

      <div className="sentinel-login-body">
        {status === "success" ? (
          <section className="sentinel-login-form">
            <h2>Registration submitted</h2>
            <Link to="/login">Back to sign in</Link>
          </section>
        ) : (
          <form className="sentinel-login-form" onSubmit={submit}>
            <header>
              <h2>Create an account</h2>
              <p>Enter your workspace details to register.</p>
            </header>

            {error && (
              <p className="sentinel-login-error" role="alert">{error}</p>
            )}

            <div className="sentinel-signup-names">
              <label>
                First name
                <input name="first_name" autoComplete="given-name" maxLength={100} required />
              </label>
              <label>
                Last name
                <input name="last_name" autoComplete="family-name" maxLength={100} />
              </label>
            </div>

            <label>
              Username
              <input name="username" autoComplete="username" maxLength={50} required />
            </label>

            <label>
              Workspace email
              <input name="email" type="email" autoComplete="email" maxLength={150} required />
            </label>

            <label>
              Password
              <input name="password" type="password" autoComplete="new-password"
                minLength={15} maxLength={256} required />
            </label>

            <label>
              Confirm password
              <input name="confirm_password" type="password" autoComplete="new-password"
                maxLength={256} required />
            </label>

            <button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Submitting…" : "Sign up"}
            </button>

            <p className="sentinel-auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}