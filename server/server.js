const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();

// Import database connection and routes
const { connectDB, getConnectionStatus } = require("./config/database");
const authRoutes = require("./routes/auth");
const tripRoutes = require("./routes/trips");
const weatherRoutes = require("./routes/weather");
const imagesRoutes = require("./routes/images");

// ✨ הוספת קובץ הדיבוג
const debug = require("./debug");

const app = express();

// חיבור למסד נתונים
connectDB()
  .then(() => {
    // ✨ הפעלת בדיקות הדיבוג אחרי חיבור מוצלח למסד הנתונים
    console.log("🔍 Running database debug checks...");
    setTimeout(() => {
      debug.runAllChecks().catch((err) => {
        console.error("Debug checks failed:", err);
      });
    }, 2000); // המתנה של 2 שניות כדי לוודא שהחיבור יציב
  })
  .catch((err) => {
    console.error("Database connection failed, skipping debug checks");
  });

// CORS middleware - חשוב לפני כל הroutesים!
app.use(
  cors({
    origin: "http://localhost:3000", // כתובת הקליינט
    credentials: true, // לשליחת cookies
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware עם MongoDB store
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "fallback-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      touchAfter: 24 * 3600, // עדכון session כל 24 שעות
      ttl: 7 * 24 * 60 * 60, // תוקף של שבוע
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS בפרודקשן
      httpOnly: true, // מונע גישה ל-cookie דרך JavaScript
      maxAge: 7 * 24 * 60 * 60 * 1000, // שבוע במילישניות
      sameSite: "lax", // הגנה מפני CSRF
    },
  })
);

// Routes - הוספת כל הנתיבים הנדרשים
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/images", imagesRoutes);

// ✨ נתיב חדש לבדיקות דיבוג ידניות
app.get("/api/debug", async (req, res) => {
  try {
    console.log("🔍 Manual debug check requested");

    const dbConnected = await debug.checkDatabaseConnection();
    const userCount = await debug.checkUsers();

    res.json({
      status: "OK",
      database: {
        connected: dbConnected,
        userCount: userCount,
      },
      message: "Debug check completed - see server console for details",
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({
      error: "Debug check failed",
      details: error.message,
    });
  }
});

// Test route
app.get("/api/test", (req, res) => {
  const dbStatus = getConnectionStatus();

  res.json({
    message: "Server is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    session: {
      hasSession: !!req.session,
      isAuthenticated: !!req.session?.userId,
      sessionID: req.sessionID,
    },
  });
});

// Database status endpoint
app.get("/api/db-status", (req, res) => {
  const dbStatus = getConnectionStatus();
  res.json({
    database: dbStatus,
    message:
      dbStatus.status === "connected"
        ? "Database connected"
        : "Database not connected",
  });
});

// Basic health check
app.get("/", (req, res) => {
  const dbStatus = getConnectionStatus();

  res.json({
    status: "OK",
    message: "Travel Planner Server is running!",
    timestamp: new Date().toISOString(),
    database: dbStatus.status,
    environment: process.env.NODE_ENV || "development",
  });
});

// Handle 404 for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    method: req.method,
    availableEndpoints: [
      "GET /api/test",
      "GET /api/db-status",
      "GET /api/debug",
      // Auth endpoints
      "POST /api/auth/register",
      "POST /api/auth/login",
      "POST /api/auth/logout",
      "GET /api/auth/me",
      // Trip endpoints
      "POST /api/trips/generate",
      "POST /api/trips/save",
      "GET /api/trips/my-trips",
      "GET /api/trips/:tripId",
      "PUT /api/trips/:tripId",
      "DELETE /api/trips/:tripId",
      // Weather endpoints
      "GET /api/weather/forecast",
      "GET /api/weather/current",
      "GET /api/weather/status",
      // Images endpoints - להוסיף גם כאן
      "GET /api/images/destination",
      "GET /api/images/status",
    ],
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  res.status(error.status || 500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Test: http://localhost:${PORT}/api/test`);
  console.log(`🌐 CORS enabled for: http://localhost:3000`);
  console.log(`📊 Database Status: http://localhost:${PORT}/api/db-status`);
  console.log(`🔍 Debug Endpoint: http://localhost:${PORT}/api/debug`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📝 Available API endpoints:`);
  console.log(`   - Auth: /api/auth/*`);
  console.log(`   - Trips: /api/trips/*`);
  console.log(`   - Weather: /api/weather/*`);
  console.log(`   - Images: /api/images/*`);
});
