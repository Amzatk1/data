import React, { useEffect, useState } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
} from "chart.js";
import "../styles/ExpenseChart.css";

// Register chart components
Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController
);

const ExpenseChart = ({ expenses, type, timeRange }) => {
  const [categoryTotals, setCategoryTotals] = useState({});
  const [timeSeriesData, setTimeSeriesData] = useState({});

  // Predefined color palette
  const colorPalette = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#FF9800", "#9C27B0",
    "#FF5733", "#33FF57", "#3357FF", "#FF33A2", "#A233FF", "#57FF33",
    "#FFD700", "#800080", "#00BFFF", "#00FF00", "#FF1493", "#8A2BE2",
    "#FF6347", "#7CFC00", "#FF4500", "#32CD32", "#ADFF2F", "#FF8C00",
  ];

  // Function to group expenses by time range
  const groupExpensesByTime = (expenses, range) => {
    const grouped = {};

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      let timeKey;

      if (range === "daily") {
        timeKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
      } else if (range === "weekly") {
        const weekNumber = getWeekNumber(date);
        timeKey = `${date.getFullYear()}-W${weekNumber}`;
      } else if (range === "monthly") {
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (range === "yearly") {
        timeKey = `${date.getFullYear()}`;
      }

      if (!grouped[expense.category]) {
        grouped[expense.category] = {};
      }
      grouped[expense.category][timeKey] =
        (grouped[expense.category][timeKey] || 0) + expense.amount;
    });

    return grouped;
  };

  // Function to get the week number of a date
  const getWeekNumber = (date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDays = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  };

  useEffect(() => {
    if (expenses.length > 0) {
      // Calculate total spending by category
      const totals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});
      setCategoryTotals(totals);

      // Group expenses by selected time range (daily, weekly, monthly, yearly)
      const groupedData = groupExpensesByTime(expenses, timeRange);
      setTimeSeriesData(groupedData);
    }
  }, [expenses, timeRange]);

  // Generate colors for the categories
  const dataColors = Object.keys(categoryTotals).map((_, index) => {
    return colorPalette[index % colorPalette.length];
  });

  // Data for Pie Chart
  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: "Spending by Category",
        data: Object.values(categoryTotals),
        backgroundColor: dataColors,
      },
    ],
  };

  // Data for Bar Chart
  const barData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: dataColors,
      },
    ],
  };

  // Prepare data for the line chart
  const timeLabels = [
    ...new Set(
      Object.values(timeSeriesData).flatMap((data) => Object.keys(data))
    ),
  ].sort();

  const lineDatasets = Object.keys(timeSeriesData).map((category, index) => ({
    label: category,
    data: timeLabels.map((label) => timeSeriesData[category]?.[label] || 0),
    borderColor: colorPalette[index % colorPalette.length],
    backgroundColor: colorPalette[index % colorPalette.length],
    fill: false,
    tension: 0.1,
  }));

  const lineData = {
    labels: timeLabels,
    datasets: lineDatasets,
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount Spent",
        },
      },
      x: {
        title: {
          display: true,
          text:
            type === "line"
              ? `Time (${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)})`
              : "Categories",
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Set to false to hide the legend entirely
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
  };


  return (
    <div className="expense-chart-container">
      {/* Pie Chart Section */}
      {type === "pie" && (
        <div className="chart-section">
          <div className="text-container">
            <h4>Pie Chart: Spending Breakdown</h4>
            <p>
              The pie chart shows the proportion of spending for each category.
              Each slice of the pie represents a category, and the size of each
              slice is proportional to the amount spent in that category.
            </p>
          </div>
          <div className="chart">
            <Pie data={pieData} />
          </div>
        </div>
      )}

      {/* Bar Chart Section */}
      {type === "bar" && (
        <div className="chart-section">
          <div className="text-container">
            <h4>Bar Chart: Spending by Category</h4>
            <p>
              The bar chart provides a clear comparison of spending across
              categories. Each bar represents the total amount spent in each
              category, making it easy to compare amounts visually.
            </p>
          </div>
          <div className="chart">
            <Bar data={barData} options={options} />
          </div>
        </div>
      )}

      {/* Line Chart Section */}
      {type === "line" && (
        <div className="chart-section">
          <div className="text-container">
            <h4>Line Chart: Spending Trends Over Time</h4>
            <p>
              The line chart shows how your spending has changed over time for
              each category. This helps identify trends and patterns in your
              expenses.
            </p>
          </div>
          <div className="chart">
            <Line data={lineData} options={options} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseChart;
