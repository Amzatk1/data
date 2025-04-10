import React, { useState } from "react";
import ExpenseChart from "./ExpenseChart";
import "../styles/Reports.css";

// Dummy data – replace with live expenses if available
const dummyExpenses = [
  { category: "Food", amount: 150, date: "2025-03-15" },
  { category: "Transport", amount: 80, date: "2025-03-16" },
  { category: "Bills", amount: 200, date: "2025-03-17" },
  { category: "Entertainment", amount: 120, date: "2025-03-18" },
  { category: "Shopping", amount: 100, date: "2025-03-18" },
  { category: "Food", amount: 60, date: "2025-03-19" },
  { category: "Transport", amount: 40, date: "2025-03-20" },
  { category: "Bills", amount: 90, date: "2025-03-21" },
];

const Reports = () => {
  const [chartType, setChartType] = useState("pie");
  const [timeRange, setTimeRange] = useState("monthly");

  return (
    <div className="reports-container">
      <h2>Reports & Insights</h2>

      <div className="report-filters">
        <label>Chart Type:</label>
        <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
          <option value="pie">Pie Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
        </select>

        {chartType === "line" && (
          <>
            <label>Time Range:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </>
        )}
      </div>

      <ExpenseChart
        expenses={dummyExpenses}
        type={chartType}
        timeRange={timeRange}
      />
    </div>
  );
};

export default Reports;
