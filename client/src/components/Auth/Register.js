import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/auth";
import "./AuthForm.css";

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // איפוס שגיאה כשמתחילים להקליד
    if (error) setError("");
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("הסיסמאות לא תואמות");
      return false;
    }
    if (formData.password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return false;
    }
    if (formData.name.trim().length < 2) {
      setError("השם חייב להכיל לפחות 2 תווים");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // בדיקת תקינות הטופס
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // הסרת confirmPassword לפני שליחה לשרת
      const { confirmPassword, ...userData } = formData;
      const response = await authService.register(userData);

      // קריאה לפונקציה שהועברה מ-App
      onLogin(response.user);
    } catch (error) {
      setError(error.message || "שגיאה בהרשמה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>הרשמה למערכת</h2>
          <p>צרו חשבון חדש ותתחילו לתכנן טיולים מדהימים</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">שם מלא</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="הכניסו את השם המלא שלכם"
              disabled={loading}
            />
          </div>

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
              placeholder="בחרו סיסמה (לפחות 6 תווים)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">אימות סיסמה</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="הקלידו את הסיסמה שוב"
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "נרשם..." : "הרשמה"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            כבר יש לכם חשבון?{" "}
            <Link to="/login" className="auth-link">
              התחברו כאן
            </Link>
          </p>
        </div>

        {/* הסבר על הפרטיות */}
        <div className="privacy-note">
          <p>
            <small>
              בהרשמה אתם מסכימים לתנאי השימוש שלנו. הנתונים שלכם מאובטחים ולא
              יועברו לצדדים שלישיים.
            </small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
