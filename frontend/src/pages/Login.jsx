import { useState } from "react";
import { LockKeyhole, Loader } from "lucide-react";
import { signIn, signUp } from "../services/auth";

export default function Login({ onAuthenticated }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
      if (result.access_token) onAuthenticated(result);
      else setMessage("Account created. Check your email and confirm your account before signing in.");
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-icon"><LockKeyhole size={26} /></div>
        <h1>WFX AI ERP</h1>
        <p>{mode === "signin" ? "Sign in to access the ERP workspace." : "Create a secure workspace account."}</p>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength="6" required autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}
        <button className="auth-submit" disabled={loading}>{loading ? <Loader className="spinner" size={18} /> : mode === "signin" ? "Sign in" : "Create account"}</button>
        <button type="button" className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
