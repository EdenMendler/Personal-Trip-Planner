import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import TripPlanner from "./components/TripPlanner/TripPlanner";
import MyTrips from "./components/MyTrips/MyTrips"; // ייבוא הקומפוננטה החדשה
import { authService } from "./services/auth";
import "./App.css";

// רכיב Loading פשוט
function Loading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
      }}
    >
      טוען...
    </div>
  );
}

// רכיב Header פשוט
function Header({ user, isAuthenticated, onLogout }) {
  const navigate = useNavigate();

  return (
    <header
      style={{
        background: "#007bff",
        color: "white",
        padding: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h1
        onClick={() => navigate("/")}
        style={{ cursor: "pointer", margin: 0 }}
      >
        🗺️ מתכנן הטיולים
      </h1>

      {isAuthenticated && (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span>שלום, {user?.name}</span>
          <nav style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => navigate("/planner")}
              style={{
                background: "transparent",
                border: "1px solid white",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              תכנון מסלול
            </button>
            <button
              onClick={() => navigate("/my-trips")}
              style={{
                background: "transparent",
                border: "1px solid white",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              המסלולים שלי
            </button>
          </nav>
          <button
            onClick={onLogout}
            style={{
              background: "transparent",
              border: "1px solid white",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            התנתק
          </button>
        </div>
      )}
    </header>
  );
}

// רכיב דף הבית
function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        ברוכים הבאים למתכנן הטיולים! 🌍
      </h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
        צרו מסלולי טיול מותאמים אישית, קבלו תחזית מזג אוויר ושמרו את המסלולים
        שלכם
      </p>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          marginTop: "2rem",
        }}
      >
        <button
          onClick={() => navigate("/planner")}
          style={{
            background: "#007bff",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          👉 תכנון מסלול חדש
        </button>
        <button
          onClick={() => navigate("/my-trips")}
          style={{
            background: "#6c757d",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          📋 המסלולים שלי
        </button>
      </div>
    </div>
  );
}

// הרכיב הראשי
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // בדיקת מצב הזדהות בטעינה הראשונית
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authService.checkAuth();
      if (response.authenticated) {
        setUser(response.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log("User not authenticated");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      // גם במקרה של שגיאה, נתנתק מקומית
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
      <div className="App">
        <Header
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />

        <main>
          <Routes>
            {/* דף הבית */}
            <Route path="/" element={<HomePage />} />

            {/* דפים ציבוריים */}
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <Login onLogin={handleLogin} />
                ) : (
                  <Navigate to="/planner" replace />
                )
              }
            />
            <Route
              path="/register"
              element={
                !isAuthenticated ? (
                  <Register onLogin={handleLogin} />
                ) : (
                  <Navigate to="/planner" replace />
                )
              }
            />

            {/* דפים פרטיים - דורשים הזדהות */}
            <Route
              path="/planner"
              element={
                isAuthenticated ? (
                  <TripPlanner user={user} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/my-trips"
              element={
                isAuthenticated ? <MyTrips /> : <Navigate to="/login" replace />
              }
            />

            {/* 404 - דף לא נמצא */}
            <Route
              path="*"
              element={
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    fontSize: "1.2rem",
                  }}
                >
                  <h2>הדף לא נמצא</h2>
                  <p>הדף שחיפשת לא קיים במערכת.</p>
                  <button
                    onClick={() => (window.location.href = "/")}
                    style={{
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      marginTop: "1rem",
                    }}
                  >
                    חזרה לדף הבית
                  </button>
                </div>
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer
          style={{
            background: "#f8f9fa",
            textAlign: "center",
            padding: "2rem",
            marginTop: "3rem",
            borderTop: "1px solid #dee2e6",
          }}
        >
          <p>&copy; 2024 מתכנן הטיולים האישי. כל הזכויות שמורות.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
