import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import PasswordStrengthBar from 'react-password-strength-bar';
import axios from "axios";
import "./Authorisation.css";
import logo from "../images/quizmaster-high-resolution-logo-black-transparent.png";

const Authorisation = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const emailInputRef = useRef(null);
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      if (role === "admin") {
        navigate("/upload");
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  useEffect(() => {
    document.title = isSignUp ? "Sign Up | ScoreMax" : "Sign In | ScoreMax";
  }, [isSignUp]);

  useEffect(() => {
    const path = window.location.pathname;
    setIsSignUp(path === "/register");
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (isSignUp) {
      if (!passwordRegex.test(formData.password)) {
        setError("Password must contain at least 6 characters, including UPPER/lowercase and numbers");
        passwordInputRef.current.focus();
        return;
      }
      if (!emailRegex.test(formData.email)) {
        setError("Invalid email");
        emailInputRef.current.focus();
        return;
      }
      if (formData.username.length < 6 || formData.username.includes(" ")) {
        setError("Username must be at least 6 characters and contain no spaces");
        usernameInputRef.current.focus();
        return;
      }
    }

    const endpoint = isSignUp ? "/register" : "/users/login";
    const requestUrl = `${process.env.REACT_APP_BACKEND_URL}${endpoint}`;

    try {
      const response = await axios.post(requestUrl, formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      setError(null);
      setFormData({ username: "", email: "", password: "" });

      const attemptedRoute = JSON.parse(localStorage.getItem('attemptedRoute'));

      if (response.data.role === "admin") {
        navigate("/upload");
      } else if (attemptedRoute) {
        navigate(`/${attemptedRoute.pathURL}`);
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      if (endpoint === "/users/register") {
        if (err.response?.data?.msg === "User already exists") {
          setError("Email already exists");
          emailInputRef.current.focus();
        } else {
          setError("Username already exists, try another one");
          usernameInputRef.current.focus();
        }
      } else {
        setError("Invalid credentials");
      }
    }
  };

  const toggleForm = () => {
    setIsSignUp(prev => !prev);
    navigate(isSignUp ? "/login" : "/register");
    setFormData({ username: "", email: "", password: "" });
    setError(null);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(prev => !prev);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="auth_container">
      <div className="form-wrapper">
        <button className="cancel-button" onClick={handleCancel} style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '2rem',
          cursor: 'pointer'
        }}>
          ×
        </button>
        <div className="logo">
          <img src={logo} alt="logo" />
        </div>
        <h2 className="title">{isSignUp ? "Sign Up" : "Sign In"}</h2>
        <form className="form" onSubmit={handleSubmit}>
          {isSignUp && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              ref={usernameInputRef}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            ref={emailInputRef}
            required
          />
          <div className="password-container">
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              ref={passwordInputRef}
              required
            />
            <i
              className={`fa-solid ${passwordVisible ? 'fa-eye' : 'fa-eye-slash'}`}
              onClick={togglePasswordVisibility}
            ></i>
          </div>

          {isSignUp && (
            <>
              <PasswordStrengthBar password={formData.password} />
              <p className="strength-analyser">
                Recommended: use uppercase letters, lowercase letters, numbers & special characters
              </p>
            </>
          )}

          {error && <p className="error">{error}</p>}
          <button className="button" type="submit">
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <button className="toggle-button" onClick={toggleForm}>
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </button>
        {!isSignUp && (
          <button className="toggle-button" onClick={() => navigate("/forgot-password")}>
            Forgot Password?
          </button>
        )}
      </div>
    </div>
  );
};

export default Authorisation;
