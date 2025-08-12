const express = require("express");
const router = express.Router();
const imageService = require("../services/ImageService");

// נתיב להשגת תמונת יעד
router.get("/destination", async (req, res) => {
  try {
    const { country, city } = req.query;

    if (!country) {
      return res.status(400).json({ error: "נדרש לציין מדינה" });
    }

    const image = await imageService.getDestinationImage(country, city || null);
    res.json(image);
  } catch (error) {
    console.error("Image API error:", error);
    res.status(500).json({ error: "שגיאה בהשגת תמונה" });
  }
});

// נתיב לבדיקת חיבור Unsplash
router.get("/status", async (req, res) => {
  try {
    const status = await imageService.testConnection();
    res.json(status);
  } catch (error) {
    console.error("Image API status error:", error);
    res.status(500).json({ error: "שגיאה בבדיקת חיבור" });
  }
});

module.exports = router;
