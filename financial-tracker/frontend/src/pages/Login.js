import React, { useState } from "react"; 
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post("http://localhost:8000/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.access_token);
      setToken(response.data.access_token); // Update state immediately
      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err.response || err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  };  

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn">
          Login
        </button>
      </form>
      <div className="register-link">
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
