const express = require("express");
const weatherService = require("../services/WeatherService");
const { requireAuth } = require("./auth");
const { query, validationResult } = require("express-validator");

const router = express.Router();

// Get Weather Forecast - תחזית מזג אוויר לשלושה ימים
router.get(
  "/forecast",
  requireAuth,
  [
    query("lat")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude must be between -90 and 90"),
    query("lon")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude must be between -180 and 180"),
    query("city")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("City name must be 1-100 characters"),
    query("country")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Country name must be 1-100 characters"),
  ],
  async (req, res) => {
    try {
      // בדיקת validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: errors.array(),
        });
      }

      const { lat, lon, city, country } = req.query;

      // בדיקה שקיבלנו נתונים מספיקים
      if ((!lat || !lon) && (!city || !country)) {
        return res.status(400).json({
          error: "Missing location data",
          message:
            "Please provide either coordinates (lat, lon) or location (city, country)",
          examples: {
            coordinates: "/api/weather/forecast?lat=32.0853&lon=34.7818",
            location: "/api/weather/forecast?city=Tel Aviv&country=Israel",
          },
        });
      }

      let weatherData;

      if (lat && lon) {
        // קבלת תחזית לפי קואורדינטות
        weatherData = await weatherService.getForecastByCoordinates(lat, lon);
      } else {
        // קבלת תחזית לפי שם מקום
        weatherData = await weatherService.getForecastByLocation(city, country);
      }

      res.json({
        success: true,
        forecast: weatherData.forecast,
        location: {
          lat: weatherData.city?.coord?.lat || parseFloat(lat),
          lon: weatherData.city?.coord?.lon || parseFloat(lon),
          name: weatherData.city?.name || city,
          country: weatherData.city?.country || country,
          timezone: weatherData.city?.timezone,
          population: weatherData.city?.population,
          sunrise: weatherData.city?.sunrise,
          sunset: weatherData.city?.sunset,
        },
        metadata: {
          generatedAt: weatherData.generatedAt,
          source: weatherData.source,
          daysCount: weatherData.forecast.length,
          requestType: lat && lon ? "coordinates" : "location",
        },
      });
    } catch (error) {
      console.error("Weather forecast error:", error);

      // טיפול בסוגי שגיאות שונים
      if (error.message.includes("API key")) {
        return res.status(500).json({
          error: "Weather service configuration error",
          message:
            "Weather API is not properly configured. Please contact support.",
          code: "API_KEY_ERROR",
        });
      } else if (error.message.includes("rate limit")) {
        return res.status(429).json({
          error: "Too many requests",
          message:
            "Weather service rate limit exceeded. Please try again later.",
          retryAfter: 3600, // שעה
          code: "RATE_LIMIT_ERROR",
        });
      } else if (error.message.includes("not found")) {
        return res.status(404).json({
          error: "Location not found",
          message: error.message,
          code: "LOCATION_NOT_FOUND",
        });
      } else {
        return res.status(500).json({
          error: "Weather service error",
          message: "Failed to fetch weather forecast. Please try again later.",
          code: "SERVICE_ERROR",
        });
      }
    }
  }
);

// Get Current Weather - מזג אוויר נוכחי
router.get(
  "/current",
  requireAuth,
  [
    query("lat")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude must be between -90 and 90"),
    query("lon")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude must be between -180 and 180"),
    query("city")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("City name must be 1-100 characters"),
    query("country")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Country name must be 1-100 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: errors.array(),
        });
      }

      const { lat, lon, city, country } = req.query;

      if ((!lat || !lon) && (!city || !country)) {
        return res.status(400).json({
          error: "Missing location data",
          message:
            "Please provide either coordinates (lat, lon) or location (city, country)",
        });
      }

      let weatherData;

      if (lat && lon) {
        weatherData = await weatherService.getCurrentWeatherByCoordinates(
          lat,
          lon
        );
      } else {
        weatherData = await weatherService.getCurrentWeatherByLocation(
          city,
          country
        );
      }

      res.json({
        success: true,
        weather: weatherData.current,
        location: weatherData.location,
        metadata: {
          generatedAt: weatherData.generatedAt,
          source: weatherData.source,
          requestType: lat && lon ? "coordinates" : "location",
        },
      });
    } catch (error) {
      console.error("Current weather error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          error: "Location not found",
          message: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Weather service error",
          message: "Failed to fetch current weather. Please try again later.",
        });
      }
    }
  }
);

// Get Weather for Trip Route
router.post(
  "/route-forecast",
  requireAuth,
  [
    query("startLat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Start latitude is required"),
    query("startLon")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Start longitude is required"),
    query("endLat")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("End latitude must be valid"),
    query("endLon")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("End longitude must be valid"),
    query("days")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Days must be between 1-5"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: errors.array(),
        });
      }

      const { startLat, startLon, endLat, endLon, days = 3 } = req.query;
      const routeWeather = [];

      // תחזית לנקודת התחלה
      const startWeather = await weatherService.getForecastByCoordinates(
        startLat,
        startLon
      );
      routeWeather.push({
        type: "start",
        location: { lat: parseFloat(startLat), lon: parseFloat(startLon) },
        forecast: startWeather.forecast.slice(0, days),
        city: startWeather.city,
      });

      // תחזית לנקודת סיום (אם קיימת ושונה מההתחלה)
      if (endLat && endLon && (endLat !== startLat || endLon !== startLon)) {
        const endWeather = await weatherService.getForecastByCoordinates(
          endLat,
          endLon
        );
        routeWeather.push({
          type: "end",
          location: { lat: parseFloat(endLat), lon: parseFloat(endLon) },
          forecast: endWeather.forecast.slice(0, days),
          city: endWeather.city,
        });
      }

      res.json({
        success: true,
        routeWeather,
        metadata: {
          generatedAt: new Date().toISOString(),
          days: days,
          points: routeWeather.length,
        },
      });
    } catch (error) {
      console.error("Route weather error:", error);
      res.status(500).json({
        error: "Failed to get route weather forecast",
        message: error.message,
      });
    }
  }
);

// Weather Service Status - סטטוס שירות מזג האוויר
router.get("/status", requireAuth, async (req, res) => {
  try {
    const status = weatherService.getStatus();
    const connectionTest = await weatherService.testConnection();

    res.json({
      success: true,
      service: {
        ...status,
        connection: connectionTest,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get weather service status",
      timestamp: new Date().toISOString(),
    });
  }
});

// Search Locations
router.get(
  "/search-locations",
  requireAuth,
  [
    query("q")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Search query must be 2-100 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Invalid search query",
          details: errors.array(),
        });
      }

      const { q, limit = 5 } = req.query;

      // חיפוש מיקומים באמצעות Geocoding API של OpenWeather
      if (!weatherService.isAvailable()) {
        return res.status(503).json({
          error: "Weather service not available",
          message: "Location search requires weather API configuration",
        });
      }

      try {
        const response = await require("axios").get(
          "http://api.openweathermap.org/geo/1.0/direct",
          {
            params: {
              q: q,
              limit: parseInt(limit),
              appid: process.env.OPENWEATHER_API_KEY,
            },
            timeout: 5000,
          }
        );

        const locations = response.data.map((location) => ({
          name: location.name,
          country: location.country,
          state: location.state,
          lat: location.lat,
          lon: location.lon,
          displayName: `${location.name}${
            location.state ? `, ${location.state}` : ""
          }, ${location.country}`,
        }));

        res.json({
          success: true,
          locations,
          query: q,
          count: locations.length,
        });
      } catch (error) {
        throw new Error("Location search failed");
      }
    } catch (error) {
      console.error("Location search error:", error);
      res.status(500).json({
        error: "Location search failed",
        message: "Could not search for locations. Please try again.",
      });
    }
  }
);

// Weather History - היסטוריית מזג אוויר (מדומה)
router.get(
  "/history",
  requireAuth,
  [
    query("lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude is required"),
    query("lon")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude is required"),
    query("date")
      .isISO8601()
      .withMessage("Date must be in ISO format (YYYY-MM-DD)"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: errors.array(),
        });
      }

      // זוהי פונקציה מדומה מכיוון שההיסטוריה דורשת API בתשלום
      // בפרויקט אמיתי נוכל להשתמש ב-Time Machine API של OpenWeather

      res.json({
        success: true,
        message: "Weather history feature requires premium API subscription",
        available: false,
        suggestion: "Use current weather and forecast data instead",
        documentation: "https://openweathermap.org/api/history",
      });
    } catch (error) {
      res.status(500).json({
        error: "Weather history service error",
        message: error.message,
      });
    }
  }
);

// Weather Alerts - התראות מזג אוויר
router.get(
  "/alerts",
  requireAuth,
  [
    query("lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude is required"),
    query("lon")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: errors.array(),
        });
      }

      // התראות מזג אוויר זמינות ב-One Call API (דורש הרשמה נפרדת)
      res.json({
        success: true,
        alerts: [],
        message: "No weather alerts for this location",
        note: "Weather alerts require One Call API subscription",
        location: {
          lat: parseFloat(req.query.lat),
          lon: parseFloat(req.query.lon),
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Weather alerts service error",
        message: error.message,
      });
    }
  }
);

module.exports = router;
