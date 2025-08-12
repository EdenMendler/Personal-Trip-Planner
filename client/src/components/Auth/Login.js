import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/auth";
import "./AuthForm.css";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(formData);

      // קריאה לפונקציה שהועברה מ-App
      onLogin(response.user);
    } catch (error) {
      setError(error.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>התחברות למערכת</h2>
          <p>ברוכים הבאים למתכנן הטיולים האישי</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">כתובת אימייל</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="הכניסו את כתובת האימייל שלכם"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="הכניסו את הסיסמה שלכם"
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "מתחבר..." : "התחברות"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            עדיין אין לכם חשבון?{" "}
            <Link to="/register" className="auth-link">
              הרשמו כאן
            </Link>
          </p>
        </div>

        {/* דוגמה למטרות פיתוח */}
        <div className="demo-info">
          <h4>למטרות פיתוח:</h4>
          <p>תוכלו להירשם עם כל אימייל וסיסמה</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
