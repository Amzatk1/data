import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Settings.css"; // optional: for custom styles

const Settings = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Load saved settings from localStorage
    const savedTheme = localStorage.getItem("theme");
    const savedCurrency = localStorage.getItem("currency");

    if (savedTheme) setTheme(savedTheme);
    if (savedCurrency) setCurrency(savedCurrency);
  }, [navigate]);

  const handleSave = () => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("currency", currency);
    alert("Settings saved!");
  };

  return (
    <div className="settings-container">
      <h2>User Settings</h2>

      <div className="setting-group">
        <label htmlFor="theme">Theme:</label>
        <select
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="setting-group">
        <label htmlFor="currency">Preferred Currency:</label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="USD">USD ($)</option>
          <option value="GBP">GBP (£)</option>
          <option value="EUR">EUR (€)</option>
          <option value="NGN">NGN (₦)</option>
        </select>
      </div>

      <button className="save-btn" onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
};

export default Settings;
