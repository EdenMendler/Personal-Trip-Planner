const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const router = express.Router();

// Middleware לבדיקת שגיאות ולידציה
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Middleware לבדיקת אימות
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Authentication required",
      authenticated: false,
    });
  }
  next();
};

// הרשמה
router.post(
  "/register",
  [
    // ולידציה של נתונים
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),

    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage("Password must contain at least one letter and one number"),

    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // בדיקה אם המשתמש כבר קיים
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: "User already exists with this email",
          field: "email",
        });
      }

      // יצירת משתמש חדש
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      await user.save();

      // יצירת session
      req.session.userId = user._id;
      req.session.userEmail = user.email;

      console.log(`✅ New user registered: ${user.email}`);

      res.status(201).json({
        message: "User registered successfully",
        user: user.toJSON(),
        authenticated: true,
      });
    } catch (error) {
      console.error("Registration error:", error);

      // טיפול בשגיאות MongoDB
      if (error.code === 11000) {
        return res.status(409).json({
          error: "Email already exists",
          field: "email",
        });
      }

      res.status(500).json({
        error: "Registration failed. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// התחברות - הקוד המתוקן והמלא
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),

    body("password").notEmpty().withMessage("Password is required"),

    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log(`🔍 Login attempt for email: ${email}`);

      // חיפוש המשתמש במסד הנתונים
      const user = await User.findByEmail(email);
      if (!user) {
        console.log(`❌ User not found: ${email}`);
        return res.status(401).json({
          error: "Invalid email or password",
          field: "credentials",
        });
      }

      console.log(`✅ User found: ${user.email}`);

      // בדיקת סיסמה
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        console.log(`❌ Invalid password for user: ${user.email}`);
        return res.status(401).json({
          error: "Invalid email or password",
          field: "credentials",
        });
      }

      console.log(`✅ Password valid for user: ${user.email}`);

      // עדכון זמן התחברות אחרון
      await user.updateLastLogin();

      // יצירת session
      req.session.userId = user._id;
      req.session.userEmail = user.email;

      console.log(`✅ User logged in successfully: ${user.email}`);

      res.json({
        message: "Login successful",
        user: user.toJSON(),
        authenticated: true,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Login failed. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// התנתקות
router.post("/logout", (req, res) => {
  const userEmail = req.session?.userEmail;

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Could not log out" });
    }

    res.clearCookie("connect.sid"); // שם cookie ברירת המחדל של express-session

    if (userEmail) {
      console.log(`✅ User logged out: ${userEmail}`);
    }

    res.json({
      message: "Logout successful",
      authenticated: false,
    });
  });
});

// בדיקת מצב אימות
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        authenticated: false,
      });
    }

    res.json({
      user: user.toJSON(),
      authenticated: true,
      session: {
        userId: req.session.userId,
        lastAccess: new Date(),
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({
      error: "Authentication check failed",
      authenticated: false,
    });
  }
});

// נתיב לקבלת סטטיסטיקות משתמש
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const currentUser = await User.findById(req.session.userId);

    res.json({
      totalUsers,
      currentUser: {
        memberSince: currentUser.createdAt,
        lastLogin: currentUser.lastLogin,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Could not fetch stats" });
  }
});

// Export middleware for use in other routes
router.requireAuth = requireAuth;

module.exports = router;
