import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import "../styles/Register.css";

const Register = () => {
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    firstName: Yup.string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name is too long")
      .required("First name is required"),
    lastName: Yup.string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name is too long")
      .required("Last name is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/\d/, "Password must contain at least one number")
      .matches(/[@$!%*?&_]/, "Password must contain at least one special character (@$!%*?&_)")
      .required("Password is required"),
  });

  return (
    <div className="register-container">
      <h2>Register</h2>

      <Formik
        initialValues={{ firstName: "", lastName: "", email: "", password: "" }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            await axios.post("http://localhost:8000/auth/register", {
              first_name: values.firstName,
              last_name: values.lastName,
              email: values.email,
              password: values.password,
            });
            setStatus({ success: "Registration successful! Redirecting to login..." });
            setTimeout(() => navigate("/login"), 2000);
          } catch (error) {
            setStatus({ error: error.response?.data?.error || "Registration failed. Please try again." });
          }
          setSubmitting(false);
        }}
      >
        {({ isSubmitting, status }) => (
          <Form>
            {status?.error && <p className="error-message">{status.error}</p>}
            {status?.success && <p className="success-message">{status.success}</p>}

            <div className="form-group">
              <label htmlFor="firstName">First Name:</label>
              <Field type="text" name="firstName" className="form-control" />
              <ErrorMessage name="firstName" component="div" className="error" />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name:</label>
              <Field type="text" name="lastName" className="form-control" />
              <ErrorMessage name="lastName" component="div" className="error" />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <Field type="email" name="email" className="form-control" />
              <ErrorMessage name="email" component="div" className="error" />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <Field type="password" name="password" className="form-control" />
              <ErrorMessage name="password" component="div" className="error" />
            </div>

            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </Form>
        )}
      </Formik>

      <div className="login-link">
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default Register;
