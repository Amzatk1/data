from datetime import timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, JWTManager
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
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
    "DATABASE_URL", "postgresql://user:password@user-db:5432/user_db"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY", "3b5e41af18179f530c5881a5191e15f0ab35eed2fefdc068fda254eed3fb1ecb"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

# Initialise Flask-JWT-Extended & SQLAlchemy
jwt = JWTManager(app)
db = SQLAlchemy(app)

# DATABASE MODELS
class User(db.Model):
    """User model for storing user information."""
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        """Hash and store the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify hashed password."""
        return check_password_hash(self.password_hash, password)


# AUTH ROUTES
@app.route("/auth/register", methods=["POST"])
def register():
    """
    Register a new user.
    Expects JSON with first_name, last_name, email, and password.
    """
    data = request.get_json()

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")

    # Validate input
    if not first_name or not last_name or not email or not password:
        app.logger.warning("Missing required fields during registration")
        return jsonify({"error": "All fields are required"}), 400

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        app.logger.warning(f"Attempted registration with existing email: {email}")
        return jsonify({"error": "Email already exists"}), 400

    # Create new user
    new_user = User(first_name=first_name, last_name=last_name, email=email)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    app.logger.info(f"New user registered: {email}")
    return jsonify({"message": "User registered successfully"}), 201


@app.route('/auth/login', methods=['POST'])
def login():
    """
    Authenticate a user and return a JWT token.
    Expects JSON with email and password.
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validate input
    if not email or not password:
        app.logger.warning("Login attempt missing email or password")
        return jsonify({"error": "Email and password are required"}), 400

    # Verify user credentials
    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))  # Store user ID as string
        app.logger.info(f"User logged in: {email}")
        return jsonify({
            "message": "Successfully logged in!",
            "access_token": access_token
        }), 200

    app.logger.warning(f"Failed login attempt for email: {email}")
    return jsonify({"error": "Invalid email or password"}), 401


@app.route('/auth/me', methods=['GET'])
@jwt_required()
def get_user():
    """
    Retrieve the logged-in user's details.
    Requires a valid JWT token.
    """
    try:
        user_id = get_jwt_identity()
        app.logger.info(f"Extracted user_id from JWT: {user_id}")

        # Convert user_id to integer
        try:
            user_id = int(user_id)
        except ValueError:
            app.logger.error("Invalid token payload: user_id is not an integer")
            return jsonify({"error": "Invalid token payload"}), 401

        # Fetch user from DB
        user = User.query.get(user_id)
        app.logger.info(f"Fetched user from DB: {user}")

        if not user:
            app.logger.warning(f"User ID {user_id} not found in database")
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email
        }), 200

    except Exception as e:
        app.logger.error(f"Error in /auth/me: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500


@app.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Log out the user.
    (Currently, this just returns a success message since JWT is stateless).
    """
    app.logger.info("User logged out")
    return jsonify({"message": "Successfully logged out!"}), 200


# HEALTH CHECK ROUTE
@app.route('/health')
def health():
    """Health check endpoint to verify service is running."""
    app.logger.info("Health check requested")
    return jsonify({"status": "User service is running"}), 200


# INITIALIZATION & RUNNING APP
if __name__ == "__main__":
    # Create all tables in the database (if they don't exist)
    with app.app_context():
        db.create_all()  # Creates the tables for all models
    
    app.logger.info("Starting User Service...")
    app.run(host="0.0.0.0", port=5001, debug=True)
