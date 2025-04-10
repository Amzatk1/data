import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = ({ setToken }) => { // Accept setToken as a prop
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:8000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUser(response.data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null); // Update token state
        navigate("/login");
      });
  }, [navigate, setToken]);

  return (
    <div className="dashboard-container">
      <h2>Welcome to Your Dashboard</h2>
      {loading && <p>Loading user data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {user && !loading && (
        <div>
          <h3>Hello, {user.first_name}!</h3>
          <p>Email: {user.email}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
