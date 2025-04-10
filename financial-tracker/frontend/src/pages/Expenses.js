import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from 'jwt-decode';
import ReactPaginate from 'react-paginate';
import ExpenseChart from "./ExpenseChart";
import "../styles/Expenses.css";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const expensesPerPage = 5;
  const [currentPage, setCurrentPage] = useState(0);
  const offset = currentPage * expensesPerPage;
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const currentExpenses = filteredExpenses.slice(offset, offset + expensesPerPage);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurring_type, setRecurringType] = useState(""); 
  const [frequency, setFrequency] = useState("");    
  const [interval, setInterval] = useState("");      
  const [end_repeat, setEndRepeat] = useState("never");    
  const [end_date, setEndDate] = useState("");             
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [timeRange, setTimeRange] = useState("monthly");
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    date: "",
    description: "",
    currency: "GBP",
    recurring: false,
    recurring_type: "",  
    frequency: "",       
    interval: "",        
    end_repeat: "never", 
    end_date: "",        
  });
  const [editExpense, setEditExpense] = useState({
    id: null,
    category: "",
    amount: "",
    date: "",
    description: "",
    currency: "GBP",
    recurring: false,
    recurring_type: "",  
    frequency: "",       
    interval: "",        
    end_repeat: "never", 
    end_date: "",        
  });
  const [filters, setFilters] = useState({
    category: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    end_date: "",
  });
  const [deleteMessage, setDeleteMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openModal = () => {
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };


  // Check if token exists in localStorage to determine if session is valid
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsSessionValid(true); // Token exists, session is valid
    } else {
      setIsSessionValid(false); // No token, session invalid
      alert("Your session has expired. Please log in again.");
      window.location.href = "/login"; // Redirect to login page
    }
  }, []);


  // Only fetch data if session is valid
  useEffect(() => {
    if (isSessionValid) {
      fetchCategories();
      fetchExpenses();
    }
  }, [isSessionValid]);


  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found, user might not be logged in.");
        return;
      }

      const decoded = jwtDecode(token);
      console.log("Decoded JWT:", decoded);
  
      // Use 'sub' as user_id
      const user_id = decoded.sub;
      if (!user_id) {
        console.error("User ID is undefined. Check JWT structure.");
        return;
      }

      const response = await axios.get("http://localhost:8000/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched expenses:", response.data);

      if (Array.isArray(response.data.expenses)) {
        setExpenses(response.data.expenses);
        setFilteredExpenses(response.data.expenses);
      } else {
        console.error("Expected an array but got:", response.data);
        setExpenses([]);
        setFilteredExpenses([]);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setExpenses([]);
      setFilteredExpenses([]);
    }
  };


  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token from localStorage:", token);
  
      if (!token) {
        console.error("No token found, user might not be logged in.");
        return;
      }
  
      const decoded = jwtDecode(token);
      console.log("Decoded JWT:", decoded);
  
      // Use 'sub' as user_id
      const user_id = decoded.sub;
      if (!user_id) {
        console.error("User ID is undefined. Check JWT structure.");
        return;
      }
  
      const response = await axios.get(`http://localhost:8000/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Categories Response:", response.data);
  
      if (Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
      } else {
        console.error("Categories data is not in expected format", response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setNewExpense({
      ...newExpense,
      [name]: type === "checkbox" ? checked : value,
    });
  };


  const handleEdit = (expense) => {
    if (!expense || !expense.id) {
      console.error("Invalid expense to edit", expense);
      return;
    }
    console.log("Editing expense:", expense);
    setEditExpense({
      id: expense.id,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      recurring: expense.recurring,
      recurring_type: expense.recurring_type || "",
      frequency: expense.frequency || "",
      interval: expense.interval || "",
      end_repeat: expense.end_repeat || "never",
      end_date: expense.end_date || "", 
    });
    openModal();
  };


  const handleSaveEdit = async (e, id) => {
    e.preventDefault();
  
    try {
      const updatedExpense = { 
        ...editExpense,
        recurring_type: editExpense.recurring ? editExpense.recurring_type : null,
        frequency: editExpense.recurring_type === "custom" ? editExpense.frequency : null,
        interval: editExpense.recurring_type === "custom" ? editExpense.interval : null,
        end_repeat: editExpense.recurring ? editExpense.end_repeat : null,
        end_date: editExpense.end_repeat === "on_date" ? editExpense.end_date : null,
      };

      // Ensure end_date is sent only if 'end_repeat' is 'on_date'
      if (updatedExpense.end_repeat === "on_date" && !updatedExpense.end_date) {
        alert("Please specify an end date.");
        return;
      }

      if (updatedExpense.currency) {
        delete updatedExpense.currency;
      }
      if (!updatedExpense.end_date) {
        delete updatedExpense.end_date;
      }
      
      console.log("Updated Expense Payload:", updatedExpense);
  
      const token = localStorage.getItem("token");
  
      const response = await axios.put(
        `http://localhost:8000/expenses/${id}`,
        updatedExpense,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 200) {
        setExpenses((prevExpenses) =>
          prevExpenses.map((expense) =>
            expense.id === id ? { ...expense, ...updatedExpense } : expense
          )
        );
        
        setFilteredExpenses((prevFiltered) =>
          prevFiltered.map((expense) =>
            expense.id === id ? { ...expense, ...updatedExpense } : expense
          )
        );

        closeModal();
        setSuccessMessage("Expense updated successfully. Refreshing expense page...");
        // Wait 1.5 seconds before refreshing
        setTimeout(() => {
            window.location.reload();
        }, 1500);
      } else {
        console.error("Error updating expense:", response.data);
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      alert(
        `Error updating expense: ${
          error.response ? error.response.data.error || error.response.data.message : error.message
        }`
      );
    }
  };  
  

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this expense?");
    
    if (confirmDelete) {
      try {
        const token = localStorage.getItem("token");
          const response = await axios.delete(`http://localhost:8000/expenses/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status === 200) {
            setDeleteMessage("Expense deleted successfully. Refreshing expense page...");

            // Wait 1.5 seconds before refreshing
            setTimeout(() => {
                window.location.reload();
            }, 1500);
          }
        } catch (error) {
          console.error("Error deleting expense:", error);
          setDeleteMessage("Error deleting expense. Please try again.");
      }
    }
  };


  const handleAddExpense = async (e) => {
    e.preventDefault();
  
    // Ensure correct key names for backend
    const expenseWithCurrency = {
      ...newExpense,
      currency: newExpense.currency || 'GBP', // Default to GBP
      recurring: isRecurring, // Ensure recurring is passed as boolean
      recurring_type: recurring_type || null, // Match backend field
      frequency: frequency || null, // Match backend field
      interval: interval || null, // Match backend field
      end_repeat: end_repeat || null, // Match backend field
      end_date: end_date || null, // Match backend field
    };
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/expenses",
        expenseWithCurrency,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 201) {
        const addedExpense = response.data;
        setExpenses([...expenses, addedExpense]);
        setFilteredExpenses([...filteredExpenses, addedExpense]);
  
        // Re-fetch the expenses from the backend
        fetchExpenses(); 
  
        setNewExpense({
          category: "",
          amount: "",
          date: "",
          description: "",
          recurring: false,
          recurring_type: "",
          frequency: "",
          interval: "",
          end_repeat: "never",
          end_date: "",
          currency: "",
        });
  
        setSuccessMessage("Expense added successfully. Refreshing expense page...");
        // Wait 1.5 seconds before refreshing
        setTimeout(() => {
            window.location.reload();
        }, 1500);
      } else {
        console.error("Error adding expense:", response.data);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert(
        `Error adding expense: ${
          error.response ? error.response.data.error : error.message
        }`
      );
    }
  };
  

  const applyFilters = () => {
    let filtered = expenses.filter((expense) => {
      return (
        (!filters.category || expense.category.toLowerCase() === filters.category.toLowerCase()) &&
        (!filters.minAmount || parseFloat(expense.amount) >= parseFloat(filters.minAmount)) &&
        (!filters.maxAmount || parseFloat(expense.amount) <= parseFloat(filters.maxAmount)) &&
        (!filters.startDate || expense.date >= filters.startDate) &&
        (!filters.end_date || expense.date <= filters.end_date)
      );
    });
    setFilteredExpenses(filtered);
  };


  const sortData = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
      if (key === "date") {
        return direction === "asc" 
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      } else if (key === "amount") {
        return direction === "asc"
          ? parseFloat(a[key]) - parseFloat(b[key])
          : parseFloat(b[key]) - parseFloat(a[key]);
      }
      return 0;
    });
    setFilteredExpenses(sortedExpenses);
    setSortConfig({ key, direction });
  };


  const handlePageClick = (event) => {
    const selectedPage = event.selected;
    setCurrentPage(selectedPage);
  };

  const handleChartChange = (event) => {
    setChartType(event.target.value);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  return (
    <div className="expenses-container">
      <h1>Expenses</h1>

      {/* Delete Message */}
      {deleteMessage && <div className="delete-message">{deleteMessage}</div>}

      {/* Success Message */}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Add Expense Form */}
      <form onSubmit={handleAddExpense} className="expense-form">
      <div class="expense-inputs">
        <div class="expense-row">
          <div class="input-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={newExpense.category}
              onChange={handleChange}
              required
            />
          </div>
          <div class="input-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>
        </div>
        <div class="expense-row">
          <div class="input-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              name="date"
              value={newExpense.date}
              onChange={handleChange}
              required
            />
          </div>
          <div class="input-group">
            <label htmlFor="description">Description (optional)</label>
            <input
              type="text"
              name="description"
              placeholder="Description (optional)"
              value={newExpense.description}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="checkbox-container">
          <div className="checkbox-label">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={() => setIsRecurring((prev) => !prev)}
            />
            <label htmlFor="recurring">Recurring Expense</label>
          </div>
        </div>
      </div>

        {/* Recurring Options (Only shown if checkbox is checked) */}
        {isRecurring && (
          <div className="recurring-options">
            {/* Left Column: Recurrence Type */}
            <div className="recurring-left">
              <label htmlFor="recurring_type">Recurrence Type</label>
              <select
                id="recurring_type"
                value={recurring_type}
                onChange={(e) => setRecurringType(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="every_two_weeks">Every Two Weeks</option>
                <option value="monthly">Every Month</option>
                <option value="yearly">Every Year</option>
                <option value="custom">Custom</option>
              </select>

              {/* Custom Recurrence Options */}
              {recurring_type === "custom" && (
                <div className="custom-recurring">
                  <label htmlFor="frequency">Frequency</label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>

                  <label htmlFor="interval">Interval (e.g., every X weeks)</label>
                  <input
                    id="interval"
                    type="number"
                    min="1"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    placeholder="Enter interval (e.g., every 3 weeks)"
                  />
                </div>
              )}
            </div>

            {/* Right Column: End Repeat */}
            <div className="recurring-right">
              <label htmlFor="end_repeat">End Repeat</label>
              <select
                id="end_repeat"
                value={end_repeat}
                onChange={(e) => setEndRepeat(e.target.value)}
              >
                <option value="never">Never</option>
                <option value="on_date">On Date</option>
              </select>

              {end_repeat === "on_date" && (
                <div className="input-group">
                  <label htmlFor="end_date">End Date:</label>
                  <input
                    id="end_date"
                    type="date"
                    value={end_date}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        <button type="submit" className="add-expense-btn">
          Add Expense
        </button>
      </form>


      {/* Filters Section */}
      <div className="filter-toggle">
        <button onClick={() => setShowFilters((prev) => !prev)}>
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="filter-dropdown">
          {/* First Column: Category */}
          <div className="filter-column">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Second Column: Min/Max Amount */}
          <div className="filter-column">
            <label htmlFor="minAmount">Min Amount</label>
            <input
              id="minAmount"
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              step="0.01"
            />

            <label htmlFor="maxAmount">Max Amount</label>
            <input
              id="maxAmount"
              type="number"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              step="0.01"
            />
          </div>

          {/* Third Column: Start/End Date */}
          <div className="filter-column">
            <label htmlFor="startDate">Start Date (dd/mm/yyyy)</label>
            <input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />

            <label htmlFor="end_date">End Date (dd/mm/yyyy)</label>
            <input
              id="end_date"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          {/* Apply Filters Button (Centered) */}
          <div className="apply-filters-container">
            <button className="apply-filters-btn" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      )}


      {/* Modal Content */}
      <div className={`modal-overlay ${isModalOpen ? "show" : ""}`}>
        <div className="modal-content">
          <h3>Edit Expense</h3>
          <form onSubmit={(e) => handleSaveEdit(e, editExpense.id)} className="expense-form">
            <div className="expense-row">
              <div className="input-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  value={editExpense.category}
                  onChange={(e) => setEditExpense({ ...editExpense, category: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  value={editExpense.amount}
                  onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="expense-row">
              <div className="input-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  value={editExpense.date}
                  onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  value={editExpense.description}
                  onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
                />
              </div>
            </div>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editExpense.recurring}
                  onChange={(e) => setEditExpense({ ...editExpense, recurring: e.target.checked })}
                />
                Recurring Expense
              </label>
            </div>
            {editExpense.recurring && (
              <div className="recurring-options">
                <div className="recurring-left">
                  <label htmlFor="recurring_type">Recurring Type</label>
                  <select
                    id="recurring_type"
                    value={editExpense.recurring_type || ""}
                    onChange={(e) => setEditExpense({ ...editExpense, recurring_type: e.target.value })}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="every_two_weeks">Every Two Weeks</option>
                    <option value="monthly">Every Month</option>
                    <option value="yearly">Every Year</option>
                    <option value="custom">Custom</option>
                  </select>
                  {editExpense.recurring_type === "custom" && (
                    <div className="custom-recurring">
                      <label htmlFor="frequency">Frequency</label>
                      <select
                        id="frequency"
                        value={editExpense.frequency || ""}
                        onChange={(e) => setEditExpense({ ...editExpense, frequency: e.target.value })}
                      >
                        <option value="">Select...</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <label htmlFor="interval">Interval (e.g., every X weeks)</label>
                      <input
                        id="interval"
                        type="number"
                        min="1"
                        value={editExpense.interval || ""}
                        onChange={(e) => setEditExpense({ ...editExpense, interval: e.target.value })}
                        placeholder="Enter interval (e.g., every 3 weeks)"
                      />
                    </div>
                  )}
                </div>
                <div className="recurring-right">
                  <label htmlFor="end_repeat">End Repeat</label>
                  <select
                    id="end_repeat"
                    value={editExpense.end_repeat || ""}
                    onChange={(e) => setEditExpense({ ...editExpense, end_repeat: e.target.value })}
                  >
                    <option value="never">Never</option>
                    <option value="on_date">On Date</option>
                  </select>
                  {editExpense.end_repeat === "on_date" && (
                    <div className="recurring-right">
                      <label htmlFor="end_date">End Date</label>
                      <input
                        type="date"
                        id="end_date"
                        value={editExpense.end_date || ""}
                        onChange={(e) => setEditExpense({ ...editExpense, end_date: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <button type="submit" className="add-expense-btn">Save Changes</button>
            <button type="button" className="close-modal-btn" onClick={closeModal}>Cancel</button>
          </form>
        </div>
      </div>


      {/* Expenses Table */}
      <table className="expenses-table">
        <thead>
          <tr>
            <th onClick={() => sortData("date")} className="sortable">
              Date {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th>Category</th>
            <th onClick={() => sortData("amount")} className="sortable">
              Amount (£) {sortConfig.key === "amount" && (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th>Description</th>
            <th>Recurring</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses && filteredExpenses.length > 0 ? (
            currentExpenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.date}</td>
                <td>{expense.category}</td>
                <td>£{parseFloat(expense.amount).toFixed(2)}</td>
                <td>{expense.description}</td>
                <td>{expense.recurring ? "Yes" : "No"}</td>
                <td>
                  <button onClick={() => handleEdit(expense)} className="edit-expense-btn">Edit</button>
                  <button onClick={() => handleDelete(expense.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No expenses found.
              </td>
            </tr>
          )}
        </tbody>
      </table>


      {/* Pagination Component */}
      {filteredExpenses.length > 0 && (
        <ReactPaginate
          previousLabel={"<< Previous"}
          nextLabel={"Next >>"}
          breakLabel={"..."}
          pageCount={Math.max(1, Math.ceil(filteredExpenses.length / expensesPerPage))}
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={handlePageClick}
          containerClassName={"pagination"}
          activeClassName={"active"}
        />
      )}

      {/* Expenses Summary Section */}
      <div className="expenses-summary">
        <h2>Expenses Summary</h2>
        <p>
          Here’s a breakdown of your spending by category. The charts below visualise how your expenses are distributed
          across different categories. This summary helps you get a quick overview of where your money is going.
        </p>
        <p>
          Take note of categories where you spend the most, and consider adjusting your budget or habits to ensure
          you're staying on track with your financial goals.
        </p>
      </div>

      {/* Spending Distribution Section */}
      <div className="spending-distribution">
        <h3>Spending Distribution</h3>
        <p>
          This chart displays the distribution of your spending across various categories. Depending on the selected
          chart type, you can view this data in different ways.
        </p>

        {/* Chart Type Selector for Bar/Pie Chart */}
        <div className="chart-type-selector">
          <label htmlFor="chartType">Select Chart Type: </label>
          <select id="chartType" value={chartType} onChange={handleChartChange}>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>

        {/* Render the selected Bar or Pie chart */}
        <div className="chart-item">
          <ExpenseChart type={chartType} expenses={expenses} />
        </div>
      </div>

      {/* Monthly Spending Trend Section */}
      <div className="spending-trend">
        <h3>Spending Trend</h3>
          <p>
            This section provides a detailed view of your spending trends over different time periods—daily, weekly,
            monthly, or yearly. By visualizing your expenses across various categories over these time ranges, you 
            can easily identify patterns, fluctuations, and long-term trends in your spending habits. This insight 
            allows you to make informed financial decisions, helping you better manage your budget and track changes
            in your spending behavior over time.
          </p>

        {/* Time Range Selector for the Line Chart */}
        <div className="time-range-selector">
          <label htmlFor="timeRange">Select Time Range: </label>
          <select id="timeRange" value={timeRange} onChange={handleTimeRangeChange}>
            <option value="daily">Days</option>
            <option value="weekly">Weeks</option>
            <option value="monthly">Months</option>
            <option value="yearly">Years</option>
          </select>
        </div>

        {/* Render the Line Chart with the selected Time Range */}
        <div className="chart-item">
          <ExpenseChart expenses={expenses} type="line" timeRange={timeRange} />
        </div>
      </div>
    </div>
  );
};

export default Expenses;
