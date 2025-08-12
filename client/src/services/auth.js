// שירות אימות - חיבור עם השרת עם MongoDB
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

class AuthService {
  constructor() {
    this.apiUrl = API_URL;
  }

  // עזר לטיפול בשגיאות
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      // זריקת שגיאה עם פרטים
      const error = new Error(data.error || "Something went wrong");
      error.status = response.status;
      error.details = data.details;
      error.field = data.field;
      throw error;
    }

    return data;
  }

  // בדיקת מצב הזדהות
  async checkAuth() {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/me`, {
        method: "GET",
        credentials: "include", // שליחת cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // הרשמה
  async register(userData) {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await this.handleResponse(response);

      // שמירת פרטי משתמש מקומית (אופציונלי)
      if (data.user) {
        this.setCurrentUser(data.user);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // התחברות
  async login(credentials) {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await this.handleResponse(response);

      // שמירת פרטי משתמש מקומית
      if (data.user) {
        this.setCurrentUser(data.user);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // התנתקות
  async logout() {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await this.handleResponse(response);

      // ניקוי נתונים מקומיים
      this.clearCurrentUser();

      return data;
    } catch (error) {
      // גם אם השרת נכשל, ננקה מקומית
      this.clearCurrentUser();
      throw error;
    }
  }

  // שמירת משתמש נוכחי ב-localStorage (אופציונלי)
  setCurrentUser(user) {
    try {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } catch (error) {
      console.warn("Could not save user to localStorage:", error);
    }
  }

  // קבלת משתמש נוכחי מ-localStorage
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem("currentUser");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.warn("Could not get user from localStorage:", error);
      return null;
    }
  }

  // ניקוי נתונים מקומיים
  clearCurrentUser() {
    try {
      localStorage.removeItem("currentUser");
    } catch (error) {
      console.warn("Could not clear user from localStorage:", error);
    }
  }

  // בדיקת תוקף אימות (לא תלוי בlocalStorage)
  async isAuthenticated() {
    try {
      const response = await this.checkAuth();
      return response.authenticated === true;
    } catch (error) {
      return false;
    }
  }

  // קבלת סטטיסטיקות משתמש
  async getUserStats() {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/stats`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // בדיקת חיבור לשרת
  async testConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/api/test`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // בדיקת מצב מסד הנתונים
  async checkDatabaseStatus() {
    try {
      const response = await fetch(`${this.apiUrl}/api/db-status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }
}

// יצירת instance יחיד של השירות
export const authService = new AuthService();
