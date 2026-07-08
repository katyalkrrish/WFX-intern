import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import NLQuery from "./pages/NLQuery";
import ProductSearch from "./pages/ProductSearch";
import ImageSearch from "./pages/ImageSearch";
import Explorer from "./pages/Explorer";

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("wfx-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("wfx-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Router>
      <div className={`app-layout ${theme}`}>
        <Sidebar theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content-panel">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/query" element={<NLQuery />} />
            <Route path="/search" element={<ProductSearch />} />
            <Route path="/image-search" element={<ImageSearch />} />
            <Route path="/explorer" element={<Explorer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}