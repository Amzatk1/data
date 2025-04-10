from datetime import timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, JWTManager
)
import os
import requests

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Configuration
USER_SERVICE_URL = os.getenv('USER_SERVICE_URL', 'http://user-service:5001')
TRANSACTION_SERVICE_URL = os.getenv("TRANSACTION_SERVICE_URL", "http://transaction-service:5002")
BUDGET_SERVICE_URL = os.getenv('BUDGET_SERVICE_URL', 'http://budget-service:5003')
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY", "3b5e41af18179f530c5881a5191e15f0ab35eed2fefdc068fda254eed3fb1ecb"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"  # Default header for JWT
app.config["JWT_HEADER_TYPE"] = "Bearer" 

# Initialise Flask-JWT-Extended
jwt = JWTManager(app)

# HEALTH CHECK ROUTE
@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint to verify that the API Gateway is running.
    """
    app.logger.info("Health check requested.")
    return jsonify({"status": "API Gateway is running"}), 200


@app.route('/auth/register', methods=["POST"])
def register():
    """
    Forward user registration request to the user-service.
    """
    try:
        data = request.get_json()
        app.logger.info("Forwarding user registration request to user-service.")

        response = requests.post(f"{USER_SERVICE_URL}/auth/register", json=data)
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting user-service: {e}")
        return jsonify({"error": "User service unavailable"}), 503


@app.route('/auth/login', methods=["POST"])
def login():
    """
    Forward user login request to the user-service.
    """
    try:
        data = request.get_json()
        app.logger.info("Forwarding user login request to user-service.")

        response = requests.post(f"{USER_SERVICE_URL}/auth/login", json=data)
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting user-service: {e}")
        return jsonify({"error": "User service unavailable"}), 503


@app.route('/auth/me', methods=["GET"])
def me():
    """
    Forward request to fetch logged-in user details to the user-service.
    """
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        app.logger.error("Authorization token is missing.")
        return jsonify({"error": "Authorization token is missing"}), 400

    if not token.startswith("Bearer "):
        app.logger.error("Invalid token format received.")
        return jsonify({"error": "Invalid token format. Expected 'Bearer <token>'"}), 400

    try:
        app.logger.info("Forwarding user info request to user-service.")
        headers = {"Authorization": token}
        response = requests.get(f"{USER_SERVICE_URL}/auth/me", headers=headers)
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting user-service: {e}")
        return jsonify({"error": "User service unavailable"}), 503


@app.route('/expenses', methods=['POST'])
def add_expense():
    """Forward request to transaction-service to add an expense."""
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        app.logger.error("Authorization token is missing.")
        return jsonify({"error": "Authorization token is missing"}), 400

    try:
        headers = {"Authorization": token, "Content-Type": "application/json"}
        data = request.get_json()
        app.logger.info(f"Forwarding expense addition request: {data}")

        response = requests.post(f"{TRANSACTION_SERVICE_URL}/expenses", headers=headers, json=data)
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting transaction-service: {e}")
        return jsonify({"error": "Transaction service unavailable"}), 503
    

@app.route('/expenses', methods=['GET'])
def fetch_expenses():
    """Fetch expenses for the logged-in user."""
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        return jsonify({"error": "Authorization token is missing"}), 400

    try:
        headers = {"Authorization": token}  # Forward token
        response = requests.get(f"{TRANSACTION_SERVICE_URL}/expenses", headers=headers)
        app.logger.info(f"Response from transaction-service (expenses): {response.status_code} - {response.json()}")
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Transaction service unavailable"}), 503


@app.route('/expenses/<expense_id>', methods=['PUT'])
@jwt_required()
def edit_expense(expense_id):
    """Forward request to transaction-service to edit an expense (excluding currency)."""
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        app.logger.error("Authorization token is missing.")
        return jsonify({"error": "Authorization token is missing"}), 400

    try:
        headers = {"Authorization": token, "Content-Type": "application/json"}
        data = request.get_json()

        # Ensure currency field is not included in the update request
        if "currency" in data:
            app.logger.warning(f"Attempt to modify currency field in expense {expense_id}")
            return jsonify({"error": "Currency field cannot be updated"}), 400

        app.logger.info(f"Forwarding expense update request for ID {expense_id}: {data}")

        response = requests.put(f"{TRANSACTION_SERVICE_URL}/expenses/{expense_id}", headers=headers, json=data)
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting transaction-service: {e}")
        return jsonify({"error": "Transaction service unavailable"}), 503


@app.route('/expenses/<expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Forward request to transaction-service to delete an expense."""
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        app.logger.error("Authorization token is missing.")
        return jsonify({"error": "Authorization token is missing"}), 400

    try:
        headers = {"Authorization": token}  # Forward token
        response = requests.delete(f"{TRANSACTION_SERVICE_URL}/expenses/{expense_id}", headers=headers)

        if response.status_code == 200:
            app.logger.info(f"Expense with ID {expense_id} deleted successfully.")
            return jsonify({"message": "Expense deleted successfully."}), 200
        else:
            app.logger.error(f"Failed to delete expense with ID {expense_id}.")
            return jsonify({"error": "Failed to delete expense"}), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting transaction-service: {e}")
        return jsonify({"error": "Transaction service unavailable"}), 503
 

@app.route('/expenses/monthly', methods=['GET'])
@jwt_required()
def get_monthly_expenses():
    """Forward request to the monthly expenses endpoint."""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Missing authorization token"}), 401

    # Forward the request to the actual expense service
    response = requests.get(f"{TRANSACTION_SERVICE_URL}/expenses/monthly", headers={"Authorization": token})

    # Return the response back to the client
    return jsonify(response.json()), response.status_code


@app.route('/categories', methods=['GET'])
@jwt_required()
def fetch_categories():
    """Fetch available expense categories from transaction-service."""
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        return jsonify({"error": "Authorization token is missing"}), 400

    try:
        user_id = get_jwt_identity()  # Extract user_id from JWT token
        headers = {"Authorization": token}
        response = requests.get(f"{TRANSACTION_SERVICE_URL}/categories", headers=headers)

        # Add CORS headers to the response
        response_data = jsonify(response.json())
        response_data.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response_data.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        response_data.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")

        return response_data, response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Transaction service unavailable"}), 503


@app.route('/budgets', methods=['POST'])
@jwt_required()
def add_budget():
    """Forward request to budget-service to add a budget."""
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        app.logger.error("Authorization token is missing.")
        return jsonify({"error": "Authorization token is missing"}), 400

    try:
        headers = {"Authorization": token, "Content-Type": "application/json"}
        data = request.get_json()
        app.logger.info(f"Forwarding budget addition request: {data}")

        response = requests.post(f"{BUDGET_SERVICE_URL}/budgets", headers=headers, json=data)
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting budget-service: {e}")
        return jsonify({"error": "Budget service unavailable"}), 503
    

@app.route('/budgets/<int:budget_id>', methods=['PUT'])
@jwt_required()
def edit_budget(budget_id):
    """Forward request to budget-service to edit a budget."""
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        app.logger.error("Authorization token is missing.")
        return jsonify({"error": "Authorization token is missing."}), 400

    try:
        headers = {"Authorization": token, "Content-Type": "application/json"}
        data = request.get_json()
        
        app.logger.info(f"Forwarding budget update request for ID {budget_id}: {data}")

        response = requests.put(f"{BUDGET_SERVICE_URL}/budgets/{budget_id}", headers=headers, json=data)
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting budget-service: {e}")
        return jsonify({"error": "Budget service unavailable."}), 503
    

@app.route('/budgets/<int:budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    """Forward request to budget-service to delete a budget."""
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        app.logger.error("Authorization token is missing.")
        return jsonify({"error": "Authorization token is missing."}), 400

    try:
        headers = {"Authorization": token}  # Forward token
        response = requests.delete(f"{BUDGET_SERVICE_URL}/budgets/{budget_id}", headers=headers)

        if response.status_code == 200:
            app.logger.info(f"Budget with ID {budget_id} deleted successfully.")
            return jsonify({"message": "Budget deleted successfully."}), 200
        else:
            app.logger.error(f"Failed to delete budget with ID {budget_id}.")
            return jsonify({"error": "Failed to delete budget."}), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting budget-service: {e}")
        return jsonify({"error": "Budget service unavailable."}), 503
    

@app.route('/budgets', methods=['GET'])
@jwt_required()
def fetch_budgets():
    """Forward request to budget-service to fetch budgets for the logged-in user."""
    token = request.headers.get("Authorization")  # Get token from headers

    if not token:
        app.logger.error("Authorization token is missing.")
        return jsonify({"error": "Authorization token is missing."}), 400

    try:
        headers = {"Authorization": token}  # Forward token
        response = requests.get(f"{BUDGET_SERVICE_URL}/budgets", headers=headers)

        if response.status_code == 200:
            app.logger.info("Successfully fetched budgets.")
            return jsonify(response.json()), response.status_code
        else:
            app.logger.error(f"Failed to fetch budgets: {response.status_code}")
            return jsonify({"error": "Failed to fetch budgets"}), response.status_code

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error contacting budget-service: {e}")
        return jsonify({"error": "Budget service unavailable"}), 503
    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
