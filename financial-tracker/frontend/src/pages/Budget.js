import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from 'jwt-decode';
import ReactPaginate from 'react-paginate';
import BudgetChart from "./BudgetChart";
import "../styles/Budget.css";

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const budgetsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(0);
  const offset = currentPage * budgetsPerPage;
  const currentBudgets = filteredBudgets.slice(offset, offset + budgetsPerPage);
  const [newBudget, setNewBudget] = useState({ category: "", budget_limit: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState({
    id: null,
    category: "",
    budget_limit: 0.0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
  });
  const [budgetStatusCounts, setBudgetStatusCounts] = useState({ good: 0, warning: 0, overBudget: 0 });
  const percentageSpent = ((totalSpent / totalBudget) * 100).toFixed(2);

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
        // Validate the token's expiration date or refresh it if necessary
        const decoded = jwtDecode(token);
        const now = new Date();
        const expirationDate = new Date(decoded.exp * 1000);
        if (now > expirationDate) {
            // Token has expired; refresh it or redirect to login page
            alert("Your session has expired. Please log in again.");
            window.location.href = "/login";
        } else {
            setIsSessionValid(true);
        }
    } else {
        setIsSessionValid(false);
    }
  }, []);

  useEffect(() => {
    const totalBudgetAmount = budgets.reduce((acc, item) => acc + Number(item.budget_limit), 0);
    const totalSpentAmount = budgets.reduce((acc, item) => acc + Number(item.spent), 0);
  
    setTotalBudget(totalBudgetAmount);
    setTotalSpent(totalSpentAmount);
    setRemainingBudget(totalBudgetAmount - totalSpentAmount);
  
    console.log("Total Budget:", totalBudgetAmount);
    console.log("Total Spent:", totalSpentAmount);
    console.log("Remaining Budget:", totalBudgetAmount - totalSpentAmount);

    if (budgets.length > 0) {
      const statusCounts = calculateBudgetStatus(budgets);
      setBudgetStatusCounts(statusCounts);
    }
  }, [budgets]);  


  const fetchBudgets = async () => {
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
  
      const response = await axios.get("http://localhost:8000/budgets", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (Array.isArray(response.data.budgets)) {
        console.log("Budgets fetched:", response.data.budgets);
        setBudgets(response.data.budgets);
        setFilteredBudgets(response.data.budgets);
        await fetchCurrentMonthExpenses();
      } else {
        console.error("Expected an array but got:", response.data);
        setBudgets([]);
        setFilteredBudgets([]);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      setBudgets([]);
      setFilteredBudgets([]);
    }
  };

  const fetchCurrentMonthExpenses = async () => {
    try {
      const token = localStorage.getItem("token");
  
      if (!token) {
        console.error("No token found, user might not be logged in.");
        return;
      }
  
      const response = await axios.get("http://localhost:8000/expenses/monthly", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.status === 200) {
        console.log("Fetched monthly aggregated expenses:", response.data);
  
        const spentMapping = {};
        let totalSpent = 0;
  
        response.data.expenses.forEach((item) => {

          if (!spentMapping[item.category]) {
              spentMapping[item.category] = 0;
          }
          spentMapping[item.category] += item.amount; 
          totalSpent += item.amount;
        });

        console.log("Spent mapping after accumulation:", spentMapping);
  

        setBudgets((prevBudgets) =>
          prevBudgets.map((budget) => ({
            ...budget,
            spent: spentMapping[budget.category] || 0,
          }))
        );
  
        setFilteredBudgets((prevFiltered) =>
          prevFiltered.map((budget) => ({
            ...budget,
            spent: spentMapping[budget.category] || 0,
          }))
        );
  
        // Calculate total budget
        const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  
        // Calculate remaining budget
        const remainingBudget = totalBudget - totalSpent;
  

        setTotalSpent(totalSpent);
        setTotalBudget(totalBudget);
        setRemainingBudget(remainingBudget);
  
        console.log("Total Budget:", totalBudget);
        console.log("Total Spent:", totalSpent);
        console.log("Remaining Budget:", remainingBudget);
      }
    } catch (error) {
      console.error("Error fetching monthly expenses:", error);
    }
  };

  // Only fetch data if session is valid
  useEffect(() => {
    if (isSessionValid) {
      fetchCategories();
      fetchBudgets();
      fetchCurrentMonthExpenses();
    }
  }, [isSessionValid]);
  
  const addBudget = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return console.error("No token found, user might not be logged in.");
  
      // Check if the category already exists
      const categoryExists = budgets.find(b => b.category === newBudget.category);
      if (categoryExists) {
        alert("A budget for this category already exists. Please select a different category.");
        return; // Prevent the addition of the new budget
      } else {
        const response = await axios.post("http://localhost:8000/budgets", newBudget, {
          headers: { Authorization: `Bearer ${token}` },
        });   
        if (response.status === 201) {
          setSuccessMessage("Budget added successfully. Refreshing budget page...");
          fetchBudgets(); // Refresh the budget list
          setNewBudget({ category: "", budget_limit: "" }); // Reset input fields
        }
      }
    } catch (error) {
      console.error("Error adding budget:", error);
    }
  };

  const handleEdit = (budget) => {
    setEditBudget({
      id: budget.id,
      category: budget.category,
      budget_limit: budget.budget_limit
    });
    openModal();
  };
  
  const handleSaveEdit = async (e, id) => {
    e.preventDefault();
  
    try {
      const updatedBudget = {
        category: editBudget.category,
        budget_limit: parseFloat(editBudget.budget_limit),
      };
  
      const token = localStorage.getItem("token");
  
      const response = await axios.put(
        `http://localhost:8000/budgets/${id}`,
        updatedBudget,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 200) {
        setBudgets((prevBudgets) =>
          prevBudgets.map((budget) =>
            budget.id === id ? { ...budget, ...updatedBudget } : budget
          )
        );

        setFilteredBudgets((prevFiltered) =>
          prevFiltered.map((budget) =>
            budget.id === id ? { ...budget, ...updatedBudget } : budget
          )
        );

        closeModal();
        setSuccessMessage("Budget updated successfully. Refreshing budget page...");
        // Wait 1.5 seconds before refreshing
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating budget:", error);
      alert(`Error updating budget: ${error.response ? error.response.data.error || error.response.data.message : error.message}`);
    }
  };
  
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this budget?");
    
    if (confirmDelete) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.delete(`http://localhost:8000/budgets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (response.status === 200) {
          setBudgets((prevBudgets) => prevBudgets.filter(budget => budget.id !== id));
          setDeleteMessage("Budget deleted successfully. Refreshing budget page...");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (error) {
        console.error("Error deleting budget:", error);
        alert("Error deleting budget. Please try again.");
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found, user might not be logged in.");
        return;
      }

      const response = await axios.get("http://localhost:8000/categories", {
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

  const sortData = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedBudgets = [...budgets].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setBudgets(sortedBudgets);
  };

  const handleBudgetChange = (e) => {
    setNewBudget({ ...newBudget, [e.target.name]: e.target.value });
  };

  const getStatus = (budget) => {
    const remaining = budget.budget_limit - budget.spent;
    if (remaining < 0) return "🔴 Over budget";
    if (remaining < budget.budget_limit * 0.2) return "🟡 Warning (near limit)";
    return "🟢 Good";
  };

  const applyFilters = () => {
    console.log("Applying filters with current filters:", filters);
    let filtered = budgets.filter(budget => {
      const status = getStatus(budget);  
      return (
        (!filters.status || status === filters.status)
      );
    });
  
    setFilteredBudgets(filtered);
    console.log("Filtered Budgets:", filtered); 
  };
  
  const calculateBudgetStatus = (budgets) => {
    if (!budgets || budgets.length === 0) {
      return {
        good: 0,
        warning: 0,
        overBudget: 0,
      };
    }
  
    const statusCounts = { good: 0, warning: 0, overBudget: 0 };
  
    budgets.forEach(budget => {
      const remaining = budget.budget_limit - budget.spent;
      if (remaining < 0) {
        statusCounts.overBudget += 1;
      } else if (remaining < budget.budget_limit * 0.2) {
        statusCounts.warning += 1;
      } else {
        statusCounts.good += 1;
      }
    });
  
    return statusCounts;
  };
 
  return (
    <div className="budget-container">
      <h1>Budget</h1>

      {/* Delete Message */}
      {deleteMessage && <div className="delete-message">{deleteMessage}</div>}

      {/* Success Message */}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Add/Set Budget Form */}
      <form onSubmit={addBudget} className="budget-form">
        <div className="budget-inputs">
          <div className="input-group">
            <label htmlFor="category">Category</label>
            <select
              name="category"
              value={newBudget.category}
              onChange={handleBudgetChange}
              required
            >
              <option value="" disabled>Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="budget_limit">Budget Limit (£)</label>
            <input
              type="number"
              name="budget_limit"
              placeholder="Budget Limit (£)"
              value={newBudget.budget_limit}
              onChange={handleBudgetChange}
              step="0.01"
              required
            />
          </div>
        </div>
        <button type="submit" className="add-budget-btn">Add Budget</button>
      </form>

    {/* Filter Toggle */}
    <div className="filter-toggle">
        <button onClick={() => setShowFilters((prev) => !prev)}>
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="filter-dropdown">
          <div className="filter-column">
            <label htmlFor="status">Budget Status</label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="🔴 Over budget">🔴 Over budget</option>
              <option value="🟡 Warning (near limit)">🟡 Warning (near limit)</option>
              <option value="🟢 Good">🟢 Good</option>
            </select>
          </div>
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
        <h3>Edit Budget</h3>
        <form onSubmit={(e) => handleSaveEdit(e, editBudget.id)} className="budget-form">
          <div className="budget-inputs">
            <div className="input-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                value={editBudget.category}
                className="disabled-input"
                disabled
              />
            </div>
            <div className="input-group">
              <label htmlFor="budget_limit">Budget Limit (£)</label>
              <input
                type="number"
                id="budget_limit"
                value={editBudget.budget_limit || ""}
                onChange={(e) => setEditBudget({ ...editBudget, budget_limit: e.target.value })}
                step="0.01"
                required
              />
            </div>
          </div>
          <button type="submit" className="add-budget-btn">Save Changes</button>
          <button type="button" className="close-modal-btn" onClick={closeModal}>Cancel</button>
        </form>
      </div>
    </div>


    {/* Budget Table once required */}
    <table className="budget-table">
      <thead>
        <tr>
          <th>Category</th>
          <th onClick={() => sortData("budget_limit")} className="sortable">
            Budget (£) {sortConfig.key === "budget_limit" && (sortConfig.direction === "asc" ? "↑" : "↓")}
          </th>
          <th onClick={() => sortData("spent")} className="sortable">
            Spent (£) {sortConfig.key === "spent" && (sortConfig.direction === "asc" ? "↑" : "↓")}
          </th>
          <th>Remaining (£)</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
      {currentBudgets.length > 0 ? (
        currentBudgets.map((budget) => {
          const remaining = (budget.budget_limit - budget.spent).toFixed(2);
          return (
            <tr key={budget.id}>
              <td>{budget.category}</td>
              <td>£{budget.budget_limit.toFixed(2)}</td>
              <td>£{budget.spent.toFixed(2)}</td>
              <td>£{remaining}</td>
              <td>{getStatus(budget)}</td>
              <td>
                <button onClick={() => handleEdit(budget)} className="edit-budget-btn">Edit</button>
                <button onClick={() => handleDelete(budget.id)}>Delete</button>
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan="6" style={{ textAlign: "center" }}>No budgets found.</td>
        </tr>
      )}
    </tbody>
    </table>

      {/* Pagination */}
      {budgets.length > 0 && (
        <ReactPaginate
          previousLabel={"<< Previous"}
          nextLabel={"Next >>"}
          breakLabel={"..."}
          pageCount={Math.max(1, Math.ceil(budgets.length / budgetsPerPage))}
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={(data) => setCurrentPage(data.selected)}
          containerClassName={"pagination"}
          activeClassName={"active"}
        />
      )}

      {/* Budget Overview Section */}
      <div className="budget-overview">
        <h2>Budget Overview</h2>
        
        <div className="overview-stats">
          <div className="stat">
            <p><strong>Total Budget:</strong> <span className="amount">£{totalBudget.toFixed(2)}</span></p>
            <small className="description">This is the total amount allocated for your budgeted categories.</small>
          </div>
          
          <div className="stat">
            <p><strong>Total Spent:</strong> <span className="amount">£{totalSpent.toFixed(2)}</span></p>
            <small className="description">This reflects the total amount spent across all budget categories.</small>
          </div>
          
          <div className="stat">
            <p><strong>Remaining Budget:</strong> <span className="amount">£{remainingBudget.toFixed(2)}</span></p>
            <small className="description">The remaining amount available in your budget.</small>
          </div>

          <div className="stat">
            <p><strong>Number of Budget Categories:</strong> <span className="amount">{budgets.length}</span></p>
            <small className="description">Total number of budget categories currently set.</small>
          </div>

          <div className="stat">
            <p><strong>Percentage of Budget Used:</strong> <span className="amount">{percentageSpent}%</span></p>
            <small className="description">The percentage of the budget that has been spent.</small>
          </div>
        </div>

        {/* Budget Status Summary */}
        <div className="budget-status-summary">
          <h3>Budget Status Summary</h3>
          <div className="status-item good">
            <p><strong>Good Budgets:</strong> <span className="amount">{budgetStatusCounts.good}</span></p>
            <small className="description">Budgets that are currently under their limit.</small>
          </div>
          
          <div className="status-item warning">
            <p><strong>Warning Budgets:</strong> <span className="amount">{budgetStatusCounts.warning}</span></p>
            <small className="description">Budgets that are near their limit (within 20%).</small>
          </div>
          
          <div className="status-item over-budget">
            <p><strong>Over Budget:</strong> <span className="amount">{budgetStatusCounts.overBudget}</span></p>
            <small className="description">Budgets that have exceeded their allocated limit.</small>
          </div>
        </div>
      </div>
      
      <div className="chart-item">
        <BudgetChart budgets={budgets} />
      </div>
    </div>
  );
};


export default Budget;