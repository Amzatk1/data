import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register necessary components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BudgetChart = ({ budgets }) => {
  // Ensure budgets is provided and is an array
  if (!budgets || !Array.isArray(budgets) || budgets.length === 0) {
    console.error("Invalid budgets data provided to BudgetChart:", budgets);
    return <div>No data available for chart.</div>;
  }

  // Prepare the data for Chart.js
  const chartData = {
    labels: budgets.map(item => item.category), 
    datasets: [
      {
        label: 'Spent',
        data: budgets.map(item => item.spent || 0), 
        backgroundColor: '#FF6B6B',
      },
      {
        label: 'Budget',
        data: budgets.map(item => item.budget_limit || 0),
        backgroundColor: '#4ECDC4',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Categories',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Amount Spent', 
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="budget-chart-container">
      <div className="chart-section">
        <div className="text-container">
          <h4>Bar Chart: Budget vs. Spending</h4>
          <p>
            This bar chart compares your budgeted amounts against your actual spending.
            Each pair of bars represents a category, with one bar denoting the budget
            limit and the other showing the amount spent. This visualisation helps you
            quickly assess where you're over or under budget.
          </p>
        </div>
        <div className="chart">
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default BudgetChart;