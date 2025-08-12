import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Common.css";

const Header = ({ user, isAuthenticated, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await onLogout();
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <Link to={isAuthenticated ? "/planner" : "/"} className="logo-link">
            <span className="logo-icon">🗺️</span>
            <span className="logo-text">מתכנן הטיולים</span>
          </Link>
        </div>

        {/* Navigation */}
        {isAuthenticated && (
          <nav className={`header-nav ${menuOpen ? "nav-open" : ""}`}>
            <Link
              to="/planner"
              className={`nav-link ${isActivePage("/planner") ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-icon">📍</span>
              תכנון מסלולים
            </Link>
            <Link
              to="/history"
              className={`nav-link ${isActivePage("/history") ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-icon">📚</span>
              היסטוריית מסלולים
            </Link>
          </nav>
        )}

        {/* User Menu */}
        <div className="header-user">
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-avatar">👤</span>
                <span className="user-name">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="logout-button"
                title="התנתקות"
              >
                <span className="logout-icon">🚪</span>
                התנתק
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link
                to="/login"
                className={`auth-link ${
                  isActivePage("/login") ? "active" : ""
                }`}
              >
                התחברות
              </Link>
              <Link
                to="/register"
                className={`auth-link register ${
                  isActivePage("/register") ? "active" : ""
                }`}
              >
                הרשמה
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        {isAuthenticated && (
          <button
            className="mobile-menu-toggle"
            onClick={toggleMenu}
            aria-label="תפריט ניווט"
          >
            <span className={`hamburger ${menuOpen ? "open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
