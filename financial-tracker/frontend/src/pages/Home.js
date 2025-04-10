import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to the Financial Tracker App!</h1>
        <p>
          Track your income, expenses, and budget all in one place. Get insights into your spending patterns and take control of your finances.
        </p>
        <div className="cta">
          <Link to="/register" className="btn">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
