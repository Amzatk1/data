from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, JWTManager
)
from flask_sqlalchemy import SQLAlchemy
import logging
import os

# Initialise Flask app
app = Flask(__name__)
app.debug = True
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO)

# Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL", "postgresql://user:password@budget-db:5432/budget_db"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY", "3b5e41af18179f530c5881a5191e15f0ab35eed2fefdc068fda254eed3fb1ecb"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"  # Default header for JWT
app.config["JWT_HEADER_TYPE"] = "Bearer" 

# Initialise Flask-JWT-Extended & SQLAlchemy
jwt = JWTManager(app)
db = SQLAlchemy(app)

# DATABASE MODELS
class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    budget_limit = db.Column(db.Float, nullable=False)
    spent = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category": self.category,
            "budget_limit": self.budget_limit,
            "spent": self.spent
        }


# BUDGET ROUTES
@app.route('/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    """Retrieve all budgets for the logged-in user"""
    try:
        user_id = get_jwt_identity()  # Extract user_id from JWT token
        user_id = int(user_id)
        app.logger.info(f"Retrieved user_id from JWT: {user_id}")  # Log user_id

        if not user_id:
            app.logger.error("User ID is None or invalid.")
            return jsonify({"error": "Invalid user authentication"}), 401

        budgets = Budget.query.filter_by(user_id=user_id).all()
        app.logger.info(f"Found {len(budgets)} budgets for user_id {user_id}")

        budgets_list = [budget.to_dict() for budget in budgets]
        return jsonify({"budgets": budgets_list}), 200

    except Exception as e:
        app.logger.error(f"Error retrieving budgets: {e}", exc_info=True)
        return jsonify({"error": "An error occurred while fetching budgets"}), 500


@app.route('/budgets', methods=['POST'])
@jwt_required()
def add_budget():
    """Add a new budget for the logged-in user"""
    data = request.get_json()
    app.logger.info(f"Received data: {data}")

    # Required fields check
    required_fields = ["category", "budget_limit"]
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        app.logger.error(f"Missing required fields: {missing_fields}")
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    # Validate budget limit
    try:
        budget_limit = float(data["budget_limit"])
        if budget_limit <= 0:
            app.logger.error("Budget limit must be greater than 0.")
            return jsonify({"error": "Budget limit must be a positive number."}), 400
    except (ValueError, TypeError):
        app.logger.error("Invalid budget limit value.")
        return jsonify({"error": "Invalid budget limit value."}), 400

    try:
        user_id = get_jwt_identity()
        user_id = int(user_id)
        app.logger.info(f"User ID: {user_id}")

        if not user_id:
            app.logger.error("User ID is missing or invalid.")
            return jsonify({"error": "User authentication failed."}), 401

        # Create a new budget object
        new_budget = Budget(
            user_id=user_id,
            category=data["category"],
            budget_limit=budget_limit
        )

        # Add budget to the database
        db.session.add(new_budget)
        db.session.commit()

        app.logger.info(f"Budget added: {new_budget.to_dict()}")
        return jsonify({"message": "Budget added", "budget": new_budget.to_dict()}), 201

    except Exception as e:
        app.logger.error(f"Error while adding budget: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while adding the budget."}), 500


@app.route('/budgets/<int:budget_id>', methods=['PUT'])
@jwt_required()
def edit_budget(budget_id):
    """Edit a budget by ID for the logged-in user"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id)
        app.logger.info(f"User ID: {user_id}")

        if not user_id:
            app.logger.error("User ID is missing or invalid.")
            return jsonify({"error": "User authentication failed"}), 401

        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()

        if not budget:
            app.logger.error(f"Budget not found for ID {budget_id} and User ID {user_id}")
            return jsonify({"error": "Budget not found"}), 404

        data = request.json
        app.logger.info(f"Received data: {data}")

        # Update fields
        budget.category = data.get("category", budget.category)  # update category
        try:
            new_budget_limit = float(data["budget_limit"])  # Ensure budget limit is a float
            if new_budget_limit <= 0:
                app.logger.error("Budget limit must be greater than 0.")
                return jsonify({"error": "Budget limit must be a positive number."}), 400
            budget.budget_limit = new_budget_limit  # Update budget limit
        except (ValueError, TypeError):
            app.logger.error("Invalid budget limit value.")
            return jsonify({"error": "Invalid budget limit value."}), 400

        db.session.commit()

        app.logger.info(f"Budget updated: {budget.to_dict()}")
        return jsonify({"message": "Budget updated successfully", "budget": budget.to_dict()}), 200

    except Exception as e:
        app.logger.error(f"Error updating budget: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while updating the budget"}), 500


@app.route('/budgets/<int:budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    """Delete a budget by ID for the logged-in user"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id)
        app.logger.info(f"User ID: {user_id}")

        if not user_id:
            app.logger.error("User ID is missing or invalid.")
            return jsonify({"error": "User authentication failed"}), 401

        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()

        if not budget:
            app.logger.error(f"Budget not found for ID {budget_id} and User ID {user_id}")
            return jsonify({"error": "Budget not found"}), 404

        db.session.delete(budget)
        db.session.commit()

        app.logger.info(f"Budget deleted: {budget.to_dict()}")
        return jsonify({"message": "Budget deleted successfully"}), 200

    except Exception as e:
        app.logger.error(f"Error deleting budget: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while deleting the budget"}), 500
    

# HEALTH CHECK ROUTE
@app.route('/health')
def health():
    """Health check endpoint to verify service is running."""
    app.logger.info("Health check requested")
    return jsonify({"status": "Budget service is running"}), 200


# INITIALIZATION & RUNNING APP
if __name__ == '__main__':
    # Create all tables in the database (if they don't exist)
    with app.app_context():
        db.create_all()  # Creates the tables for all models
    app.logger.info("Starting Budget Service...")
    app.run(host='0.0.0.0', port=5003)
