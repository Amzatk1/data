from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, JWTManager
)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Enum
import enum
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
    "DATABASE_URL", "postgresql://user:password@transaction-db:5432/transaction_db"
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


# Define Enums for Expense model
class CurrencyEnum(enum.Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    AUD = "AUD"
    CAD = "CAD"
    CHF = "CHF"
    CNY = "CNY"
    INR = "INR"
    NZD = "NZD"
    MXN = "MXN"
    SGD = "SGD"
    HKD = "HKD"
    SEK = "SEK"
    NOK = "NOK"
    DKK = "DKK"
    KRW = "KRW"
    BRL = "BRL"
    BWP = "BWP"
    BDT = "BDT"
    BGN = "BGN"
    BHD = "BHD"
    BIF = "BIF"
    BOB = "BOB"
    CVE = "CVE"
    CZK = "CZK"
    DOP = "DOP"
    EGP = "EGP"
    ETB = "ETB"
    FJD = "FJD"
    GHS = "GHS"
    GIP = "GIP"
    GMD = "GMD"
    GNF = "GNF"
    GTQ = "GTQ"
    HUF = "HUF"
    IDR = "IDR"
    ISK = "ISK"
    JOD = "JOD"
    KES = "KES"
    KWD = "KWD"
    LAK = "LAK"
    LKR = "LKR"
    MAD = "MAD"
    MGA = "MGA"
    MWK = "MWK"
    MYR = "MYR"
    MZN = "MZN"
    NGN = "NGN"
    NPR = "NPR"
    OMR = "OMR"
    PEN = "PEN"
    PHP = "PHP"
    PKR = "PKR"
    PLN = "PLN"
    PYG = "PYG"
    QAR = "QAR"
    RON = "RON"
    RWF = "RWF"
    SAR = "SAR"
    SLE = "SLE"
    SRD = "SRD"
    THB = "THB"
    TND = "TND"
    TRY = "TRY"
    TWD = "TWD"
    TZS = "TZS"
    UGX = "UGX"
    VND = "VND"
    XAF = "XAF"
    XCD = "XCD"
    XOF = "XOF"
    ZAR = "ZAR"
    ZMW = "ZMW"

class RecurringTypeEnum(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    FORTNIGHTLY = "every_two_weeks"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    CUSTOM = "custom"

class FrequencyEnum(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class EndRepeatEnum(enum.Enum):
    NEVER = "never"
    ON_DATE = "on_date"


# DATABASE MODELS
class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)  
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.Enum(CurrencyEnum), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255))

    # Recurring fields
    recurring = db.Column(db.Boolean, nullable=False, default=False)
    recurring_type = db.Column(db.Enum(RecurringTypeEnum), nullable=True)  
    frequency = db.Column(db.Enum(FrequencyEnum), nullable=True) 
    interval = db.Column(db.Integer, nullable=True)
    end_repeat = db.Column(db.Enum(EndRepeatEnum), nullable=True)
    end_date = db.Column(db.Date, nullable=True) 

    def to_dict(self):
        """Convert object to dictionary for JSON response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": self.amount,
            "currency": self.currency.value,
            "category": self.category,
            "date": self.date.strftime('%Y-%m-%d'),
            "description": self.description,
            "recurring": self.recurring,
            "recurring_type": self.recurring_type.value if self.recurring_type else None,
            "interval": self.interval,
            "end_repeat": self.end_repeat.value if self.end_repeat else None,
            "end_date": self.end_date.strftime('%Y-%m-%d') if self.end_date else None
        }


@app.route('/transactions', methods=['GET'])
def get_transactions():
    return jsonify({"message": "Transaction service active"}), 200


# EXPENSES ROUTES
@app.route('/expenses', methods=['POST'])
@jwt_required()
def add_expense():
    """Add a new expense for the logged-in user"""
    data = request.get_json()
    app.logger.info(f"Received data: {data}")  

    # Default currency to GBP if not provided
    currency = data.get('currency', 'GBP')

    # Required fields check
    required_fields = ["amount", "currency", "category", "date", "description", "recurring"]
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        app.logger.error(f"Missing required fields: {missing_fields}")
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    # Validate currency code (must be a 3-letter code)
    if len(currency) != 3:
        app.logger.error(f"Invalid currency code: {currency}")
        return jsonify({"error": "Invalid currency code"}), 400

    try:
        user_id = get_jwt_identity()
        user_id = int(user_id)
        app.logger.info(f"User ID: {user_id}")

        if not user_id:
            app.logger.error("User ID is missing or invalid.")
            return jsonify({"error": "User authentication failed"}), 401

        # Validate date format and ensure it is not in the future
        try:
            expense_date = datetime.strptime(data["date"], '%Y-%m-%d').date()
            if expense_date > datetime.today().date():
                app.logger.error(f"Invalid date: {expense_date}. Future expenses are not allowed.")
                return jsonify({"error": "Expense date cannot be in the future"}), 400
        except ValueError:
            app.logger.error(f"Invalid date format: {data['date']}")
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        # Parse recurring fields if applicable
        recurring = data["recurring"]
        recurring_type = data.get("recurring_type")
        frequency = data.get("frequency") if recurring_type == "custom" else None
        interval = data.get("interval") if recurring_type == "custom" else None
        end_repeat = data.get("end_repeat")
        end_date = data.get("end_date")

        # Convert end_date to a Date object if provided
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                if end_date < expense_date:
                    app.logger.error("End date cannot be before the expense date.")
                    return jsonify({"error": "End date must be after the expense date"}), 400
            except ValueError:
                app.logger.error(f"Invalid end_date format: {end_date}")
                return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD"}), 400

        # Custom recurrence validation
        if recurring and recurring_type == "custom":
            if not frequency or not interval:
                app.logger.error("Custom recurrence requires frequency and interval.")
                return jsonify({"error": "Custom recurrence requires frequency and interval"}), 400
            if interval <= 0:
                app.logger.error("Interval must be greater than 0.")
                return jsonify({"error": "Interval must be a positive number"}), 400

        # Create a new expense object
        new_expense = Expense(
            user_id=user_id,
            amount=data["amount"],
            currency=currency,
            category=data["category"],
            date=expense_date,
            description=data["description"],
            recurring=recurring,
            recurring_type=RecurringTypeEnum(recurring_type) if recurring_type else None,
            frequency=FrequencyEnum(frequency) if frequency else None,
            interval=interval,
            end_repeat=EndRepeatEnum(end_repeat) if end_repeat else None,
            end_date=end_date
        )

        # Add expense to the database
        db.session.add(new_expense)
        db.session.commit()

        app.logger.info(f"Expense added: {new_expense.to_dict()}")
        return jsonify({"message": "Expense added", "expense": new_expense.to_dict()}), 201

    except ValueError as ve:
        app.logger.error(f"Value error: {str(ve)}")
        return jsonify({"error": "Invalid value provided"}), 400

    except Exception as e:
        app.logger.error(f"Error while adding expense: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while adding the expense"}), 500


@app.route('/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    """Retrieve all expenses for the logged-in user"""
    try:
        user_id = get_jwt_identity()  # Extract user_id from JWT token
        user_id = int(user_id)
        app.logger.info(f"Retrieved user_id from JWT: {user_id}")  # Log user_id

        if not user_id:
            app.logger.error("User ID is None or invalid.")
            return jsonify({"error": "Invalid user authentication"}), 401

        expenses = Expense.query.filter_by(user_id=user_id).all()
        app.logger.info(f"Found {len(expenses)} expenses for user_id {user_id}")

        expenses_list = [expense.to_dict() for expense in expenses]
        return jsonify({"expenses": expenses_list}), 200
    except Exception as e:
        app.logger.error(f"Error retrieving expenses: {e}", exc_info=True)
        return jsonify({"error": "An error occurred while fetching expenses"}), 500
    

@app.route('/expenses/<int:expense_id>', methods=['PUT'])
@jwt_required()
def edit_expense(expense_id):
    """Edit an expense by ID for the logged-in user"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id)
        app.logger.info(f"User ID: {user_id}")

        if not user_id:
            app.logger.error("User ID is missing or invalid.")
            return jsonify({"error": "User authentication failed"}), 401

        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()

        if not expense:
            app.logger.error(f"Expense not found for ID {expense_id} and User ID {user_id}")
            return jsonify({"error": "Expense not found"}), 404

        data = request.json

        app.logger.info(f"Received data: {data}") 
        # Validate date if it is being updated
        if "date" in data:
            try:
                new_date = datetime.strptime(data["date"], '%Y-%m-%d').date()
                if new_date > datetime.today().date():
                    app.logger.error(f"Invalid date: {new_date}. Future expenses are not allowed.")
                    return jsonify({"error": "Expense date cannot be in the future"}), 400
                expense.date = new_date
            except ValueError:
                app.logger.error(f"Invalid date format: {data['date']}")
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        # Validate end_date if updated
        if "end_date" in data:
            try:
                new_end_date = datetime.strptime(data["end_date"], '%Y-%m-%d').date()
                if new_end_date < expense.date:
                    app.logger.error("End date cannot be before the expense date.")
                    return jsonify({"error": "End date must be after the expense date"}), 400
                expense.end_date = new_end_date
            except ValueError:
                app.logger.error(f"Invalid end_date format: {data['end_date']}")
                return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD"}), 400

        # Validate custom recurrence fields
        if expense.recurring and expense.recurring_type == RecurringTypeEnum.CUSTOM:
            if "interval" in data:
                try:
                    interval_value = int(data["interval"])  # Convert to integer
                    if interval_value <= 0:
                        app.logger.error("Interval must be greater than 0.")
                        return jsonify({"error": "Interval must be a positive number"}), 400
                    expense.interval = interval_value  # Assign as an integer
                except ValueError:
                    app.logger.error("Interval must be a valid integer.")
                    return jsonify({"error": "Interval must be a valid integer"}), 400

         # Setting the recurring type enum
        if expense.recurring:
            recurring_type = data.get("recurring_type", None)
            if recurring_type:
                if recurring_type.lower() == 'daily':
                    expense.recurring_type = RecurringTypeEnum.DAILY
                elif recurring_type.lower() == 'weekly':
                    expense.recurring_type = RecurringTypeEnum.WEEKLY
                elif recurring_type.lower() == "every_two_weeks":
                    expense.recurring_type = RecurringTypeEnum.FORTNIGHTLY
                elif recurring_type.lower() == 'monthly':
                    expense.recurring_type = RecurringTypeEnum.MONTHLY
                elif recurring_type.lower() == 'yearly':
                    expense.recurring_type = RecurringTypeEnum.YEARLY
                elif recurring_type.lower() == 'custom':
                    expense.recurring_type = RecurringTypeEnum.CUSTOM
            else:
                app.logger.error(f"Invalid recurring type: {recurring_type}")
                return jsonify({"error": "Invalid recurring type"}), 400

        # Setting the frequency enum
        if expense.recurring and expense.recurring_type == RecurringTypeEnum.CUSTOM:
            frequency = data.get("frequency", None)
            if frequency:
                if frequency.lower() == 'daily':
                    expense.frequency = FrequencyEnum.DAILY
                elif frequency.lower() == 'weekly':
                    expense.frequency = FrequencyEnum.WEEKLY
                elif frequency.lower() == 'monthly':
                    expense.frequency = FrequencyEnum.MONTHLY
                elif frequency.lower() == 'yearly':
                    expense.frequency = FrequencyEnum.YEARLY
            else:
                app.logger.error(f"Invalid frequency: {frequency}")
                return jsonify({"error": "Invalid frequency"}), 400
        
        # Setting the end_repeat enum
        if expense.recurring:
            end_repeat = data.get("end_repeat", None)
            if end_repeat:
                if end_repeat.lower() == 'never':
                    expense.end_repeat = EndRepeatEnum.NEVER
                    expense.end_date = None
                elif end_repeat.lower() == 'on_date':
                    expense.end_repeat = EndRepeatEnum.ON_DATE
                else:
                    app.logger.error(f"Invalid end_repeat value: {end_repeat}")
                    return jsonify({"error": "Invalid end_repeat value"}), 400
            else:
                app.logger.error("end_repeat is missing")
                return jsonify({"error": "end_repeat is required"}), 400

        # Update other fields
        expense.category = data.get("category", expense.category)
        expense.amount = data.get("amount", expense.amount)
        expense.description = data.get("description", expense.description)

        db.session.commit()

        app.logger.info(f"Expense updated: {expense.to_dict()}")
        return jsonify({"message": "Expense updated successfully", "expense": expense.to_dict()}), 200

    except Exception as e:
        app.logger.error(f"Error updating expense: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while updating the expense"}), 500



@app.route('/expenses/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Delete an expense by ID for the logged-in user"""
    try:
        # Get user_id from JWT token
        user_id = get_jwt_identity()
        user_id = int(user_id)
        app.logger.info(f"User ID: {user_id}")

        if not user_id:
            app.logger.error("User ID is missing or invalid.")
            return jsonify({"error": "User authentication failed"}), 401

        # Fetch the expense from the database
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()

        if not expense:
            app.logger.error(f"Expense not found for ID {expense_id} and User ID {user_id}")
            return jsonify({"error": "Expense not found"}), 404

        # Delete the expense from the database
        db.session.delete(expense)
        db.session.commit()

        app.logger.info(f"Expense deleted: {expense.to_dict()}")
        return jsonify({"message": "Expense deleted successfully"}), 200

    except Exception as e:
        app.logger.error(f"Error deleting expense: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while deleting the expense"}), 500



@app.route('/expenses/monthly', methods=['GET'])
@jwt_required()
def get_monthly_expenses():
    """Retrieve expenses for the logged-in user for the current month"""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id)
        app.logger.info(f"Retrieved user_id from JWT: {user_id}")

        if not user_id:
            app.logger.error("User ID is None or invalid.")
            return jsonify({"error": "Invalid user authentication"}), 401

        # Get the start and end dates for the current month
        now = datetime.now()
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = (start_date + relativedelta(months=1)).replace(day=1)

        app.logger.info(f"Fetching expenses from {start_date} to {end_date}")

        # Query expenses for the current month
        expenses = Expense.query.filter(
            Expense.user_id == user_id,
            Expense.date >= start_date,
            Expense.date < end_date
        ).all()

        app.logger.info(f"Found {len(expenses)} monthly expenses for user_id {user_id}")

        expenses_list = [expense.to_dict() for expense in expenses]
        return jsonify({"expenses": expenses_list}), 200

    except Exception as e:
        app.logger.error(f"Error retrieving monthly expenses: {e}", exc_info=True)
        return jsonify({"error": "An error occurred while fetching monthly expenses"}), 500
    

@app.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Retrieve distinct categories for the logged-in user"""
    try:
        user_id = get_jwt_identity()  # Extract user_id from JWT token
        user_id = int(user_id)
        app.logger.info(f"Retrieved user_id from JWT: {user_id}")  # Log user_id

        if not user_id:
            app.logger.error("User ID is None or invalid.")
            return jsonify({"error": "Invalid user authentication"}), 401

        categories = db.session.query(Expense.category).filter_by(user_id=user_id).distinct().all()
        category_list = [category[0] for category in categories]
        app.logger.info(f"Category list: {category_list}")

        return jsonify({"categories": category_list}), 200
    except Exception as e:
        app.logger.error(f"Error retrieving categories: {e}", exc_info=True)
        return jsonify({"error": "An error occurred while fetching categories"}), 500


# HEALTH CHECK ROUTE
@app.route('/health')
def health():
    """Health check endpoint to verify service is running."""
    app.logger.info("Health check requested")
    return jsonify({"status": "User service is running"}), 200


# INITIALISATION & RUNNING APP
if __name__ == "__main__":
    # Create all tables in the database (if they don't exist)
    with app.app_context():
        db.create_all()  # Creates the tables for all models

    app.logger.info("Starting Transaction Service...")
    app.run(host='0.0.0.0', port=5002, debug=True)
