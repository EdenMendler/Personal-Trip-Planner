const express = require("express");
const Trip = require("../models/Trip");
const { body, validationResult } = require("express-validator");
const { requireAuth } = require("./auth");
const llmService = require("../services/LLMService");

const router = express.Router();

// Cache לבקשות אחרונות
const recentRequests = new Map();
const REQUEST_CACHE_TIME = 15000; // 15 שניות בלבד

// ניקוי cache ישן
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentRequests.entries()) {
    if (now - timestamp > REQUEST_CACHE_TIME) {
      recentRequests.delete(key);
    }
  }
}, 30000);

// Generate Trip - יצירת מסלול חדש עם routing מתוקן
router.post(
  "/generate",
  requireAuth,
  [
    body("destination.country")
      .trim()
      .notEmpty()
      .withMessage("Country is required"),
    body("destination.city").optional().trim(),
    body("tripType")
      .isIn(["walk", "bike", "trek"])
      .withMessage("Trip type must be walk, bike, or trek"),
  ],
  async (req, res) => {
    console.log("🚀 Trip generation request received");

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({
          error: "נתונים לא תקינים",
          details: errors.array(),
        });
      }

      const { destination, tripType, timestamp, requestId } = req.body;
      const userId = req.session.userId;

      console.log(`🎯 Trip generation for user ${userId}:`, {
        destination: destination.city || destination.country,
        tripType,
        requestId,
      });

      // בדיקת duplicate request
      const requestKey = `${userId}-${JSON.stringify(destination)}-${tripType}`;
      const lastRequest = recentRequests.get(requestKey);

      if (lastRequest && Date.now() - lastRequest < REQUEST_CACHE_TIME) {
        console.log("⚠️ Duplicate request detected");
        return res.status(429).json({
          error: "בקשה חוזרת מהירה מדי",
          message: "אנא המתינו מעט לפני יצירת מסלול נוסף",
          retryAfter: Math.ceil(
            (REQUEST_CACHE_TIME - (Date.now() - lastRequest)) / 1000
          ),
        });
      }

      recentRequests.set(requestKey, Date.now());

      // תיקון שם העיר אם לא סופק
      if (!destination.city) {
        destination.city = destination.country;
      }

      console.log("🗺️ Calling LLM service for trip generation...");

      // קריאה לשירות עם timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Service timeout")), 30000)
      );

      const tripData = await Promise.race([
        llmService.generateTrip(destination, tripType),
        timeoutPromise,
      ]);

      if (!tripData) {
        console.error("❌ No trip data received from service");
        return res.status(500).json({
          error: "שגיאה ביצירת המסלול",
          message: "לא הצלחנו ליצור מסלול עבור היעד הזה. אנא נסו יעד אחר.",
        });
      }

      console.log("✅ Trip generated successfully");

      // הוספת מידע נוסף לתגובה
      const response = {
        trip: {
          ...tripData,
          generatedFor: {
            userId,
            requestId,
            timestamp: new Date().toISOString(),
          },
        },
        message: "המסלול נוצר בהצלחה!",
        routing: tripData.routing || {
          engine: tripData.source,
          realRoads: tripData.source === "Real Routing API",
          quality: tripData.source === "Real Routing API" ? "high" : "fallback",
        },
      };

      res.json(response);
    } catch (error) {
      console.error("❌ Trip generation error:", error);

      // הסרת request מ-cache כדי לאפשר retry
      const requestKey = `${req.session.userId}-${JSON.stringify(
        req.body.destination
      )}-${req.body.tripType}`;
      recentRequests.delete(requestKey);

      // טיפול בסוגי שגיאות שונים
      let errorMessage = "שגיאה ביצירת המסלול";
      let statusCode = 500;

      if (
        error.message.includes("timeout") ||
        error.message.includes("Service timeout")
      ) {
        errorMessage = "היצירה נמשכת יותר מהצפוי. אנא נסו שוב.";
        statusCode = 408;
      } else if (
        error.message.includes("coordinates") ||
        error.message.includes("geocoding")
      ) {
        errorMessage = "לא מצאנו את המיקום הזה. אנא בדקו את שם העיר והמדינה.";
        statusCode = 400;
      } else if (
        error.message.includes("network") ||
        error.message.includes("ECONNREFUSED")
      ) {
        errorMessage = "בעיית חיבור לשירות. אנא נסו שוב בעוד מעט.";
        statusCode = 503;
      }

      res.status(statusCode).json({
        error: errorMessage,
        canRetry: statusCode !== 400,
        retryAfter: statusCode === 503 ? 30 : undefined,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Save Trip - שמירת מסלול
router.post(
  "/save",
  requireAuth,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("שם הטיול לא יכול להיות יותר מ-100 תווים"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("התיאור לא יכול להיות יותר מ-500 תווים"),
    body("destination.country").trim().notEmpty().withMessage("מדינה נדרשת"),
    body("tripType")
      .isIn(["walk", "bike", "trek"])
      .withMessage("סוג הטיול חייב להיות הליכה, אופניים או טרק"),
    body("routes").isArray({ min: 1 }).withMessage("נדרש לפחות מסלול אחד"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "נתונים לא תקינים",
          details: errors.array(),
        });
      }

      const userId = req.session.userId;
      console.log(`💾 Saving trip for user ${userId}`);

      // הכנת נתוני הטיול לשמירה
      const tripData = {
        ...req.body,
        userId,
        // המרת trek ל-walk לצורך consistency
        tripType: req.body.tripType === "trek" ? "walk" : req.body.tripType,
      };

      // ניקוי שדות שלא נדרשים במסד הנתונים
      delete tripData.weather;
      delete tripData.generatedAt;
      delete tripData.timestamp;
      delete tripData.requestId;
      delete tripData.generatedFor;

      // יצירת שם ברירת מחדל אם לא סופק
      if (!tripData.name) {
        const destination =
          tripData.destination.city || tripData.destination.country;
        const type = tripData.tripType === "bike" ? "רכיבה" : "הליכה";
        tripData.name = `${type} ב${destination}`;
      }

      const newTrip = new Trip(tripData);
      const savedTrip = await newTrip.save();

      console.log(`✅ Trip saved successfully with ID: ${savedTrip._id}`);

      res.status(201).json({
        message: "הטיול נשמר בהצלחה!",
        trip: savedTrip,
        tripId: savedTrip._id,
      });
    } catch (error) {
      console.error("❌ Trip save error:", error);

      if (error.name === "ValidationError") {
        res.status(400).json({
          error: "נתוני הטיול לא תקינים",
          details: Object.values(error.errors).map((err) => err.message),
        });
      } else if (error.code === 11000) {
        res.status(409).json({
          error: "טיול עם השם הזה כבר קיים",
        });
      } else {
        res.status(500).json({
          error: "שגיאה בשמירת הטיול",
          message: "אנא נסו שוב או פנו לתמיכה",
        });
      }
    }
  }
);

// Get My Trips - קבלת טיולים של המשתמש
router.get("/my-trips", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    console.log(`📋 Fetching trips for user ${userId}, page ${page}`);

    const [trips, totalTrips] = await Promise.all([
      Trip.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Trip.countDocuments({ userId }),
    ]);

    const totalPages = Math.ceil(totalTrips / limit);

    res.json({
      trips,
      pagination: {
        currentPage: page,
        totalPages,
        totalTrips,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching trips:", error);
    res.status(500).json({
      error: "שגיאה בטעינת הטיולים",
      message: "אנא נסו שוב",
    });
  }
});

// Get Single Trip - קבלת טיול בודד
router.get("/:tripId", requireAuth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.session.userId;

    console.log(`🔍 Fetching trip ${tripId} for user ${userId}`);

    const trip = await Trip.findOne({ _id: tripId, userId });

    if (!trip) {
      return res.status(404).json({
        error: "הטיול לא נמצא",
        message: "הטיול המבוקש לא קיים או שאין לכם גישה אליו",
      });
    }

    res.json({ trip });
  } catch (error) {
    console.error("❌ Error fetching trip:", error);

    if (error.name === "CastError") {
      res.status(400).json({
        error: "מזהה טיול לא תקין",
      });
    } else {
      res.status(500).json({
        error: "שגיאה בטעינת הטיול",
      });
    }
  }
});

// Delete Trip - מחיקת טיול
router.delete("/:tripId", requireAuth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.session.userId;

    console.log(`🗑️ Deleting trip ${tripId} for user ${userId}`);

    const trip = await Trip.findOneAndDelete({ _id: tripId, userId });

    if (!trip) {
      return res.status(404).json({
        error: "הטיול לא נמצא",
      });
    }

    console.log(`✅ Trip ${tripId} deleted successfully`);

    res.json({
      message: "הטיול נמחק בהצלחה",
      deletedTrip: {
        id: trip._id,
        name: trip.name,
      },
    });
  } catch (error) {
    console.error("❌ Error deleting trip:", error);

    if (error.name === "CastError") {
      res.status(400).json({
        error: "מזהה טיול לא תקין",
      });
    } else {
      res.status(500).json({
        error: "שגיאה במחיקת הטיול",
      });
    }
  }
});

// Service Status - בדיקת סטטוס השירות
router.get("/status/generation", requireAuth, async (req, res) => {
  try {
    const llmStatus = llmService.getStatus();

    res.json({
      status: "operational",
      service: llmStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Status check error:", error);
    res.status(500).json({
      status: "degraded",
      error: "שגיאה בבדיקת סטטוס השירות",
    });
  }
});

module.exports = router;
