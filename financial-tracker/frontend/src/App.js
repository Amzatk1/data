import "./styles/App.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Budget from "./pages/Budget";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      setTheme(localStorage.getItem("theme") || "light");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <div className={`App ${theme}`}>
        <nav className="navbar">
          <div className="navbar-brand">
            <h2>Financial Tracker</h2>
          </div>
          <ul className="navbar-links">
            {!token && <li><Link to="/">Home</Link></li>}
            {token ? (
              <>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/expenses">Expenses</Link></li>
                <li><Link to="/budget">Budget</Link></li> 
                <li><Link to="/reports">Reports</Link></li>
                <li><Link to="/settings">Settings</Link></li>
                <li>
                  <Link to="/" onClick={() => { localStorage.removeItem("token"); setToken(null); }}>
                    Logout
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            )}
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/dashboard" element={<Dashboard setToken={setToken} />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
