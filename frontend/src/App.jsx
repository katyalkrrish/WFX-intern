import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import NLQuery from "./pages/NLQuery";
import ProductSearch from "./pages/ProductSearch";
import Explorer from "./pages/Explorer";
import Login from "./pages/Login";
import { getSession, signOut } from "./services/auth";

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("wfx-theme") || "light";
  });
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("wfx-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleSignOut = () => {
    signOut();
    setSession(null);
  };

  if (!session?.access_token) return <Login onAuthenticated={setSession} />;

  return (
    <Router>
      <div className={`app-layout ${theme}`}>
        <Sidebar theme={theme} toggleTheme={toggleTheme} userEmail={session.user?.email} onSignOut={handleSignOut} />
        <main className="main-content-panel">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/query" element={<NLQuery />} />
            <Route path="/search" element={<ProductSearch />} />
            <Route path="/explorer" element={<Explorer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
