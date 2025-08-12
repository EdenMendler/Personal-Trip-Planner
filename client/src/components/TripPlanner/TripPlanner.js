import React, { useState } from "react";
import TripForm from "./TripForm";
import TripMap from "./TripMap";
import WeatherDisplay from "./WeatherDisplay";
import TripSummary from "./TripSummary";
import { apiService } from "../../services/api";
import "./TripPlanner.css";

const TripPlanner = () => {
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState(null);
  const [step, setStep] = useState("form"); // form, preview, save
  const [tripGenerationCount, setTripGenerationCount] = useState(0); // רק זה נוסף לתיקון

  // יצירת מסלול חדש
  const handleGenerateTrip = async (tripData) => {
    console.log("🚀 Starting trip generation with data:", tripData);
    setLoading(true);
    setError("");

    try {
      console.log("📡 Calling generateTrip API...");

      // יצירת מסלול עם LLM
      const tripResponse = await apiService.generateTrip(
        tripData.destination,
        tripData.tripType
      );

      console.log("✅ Trip generated successfully:", tripResponse);
      setCurrentTrip(tripResponse.trip);

      // קבלת תחזית מזג אוויר
      try {
        console.log("🌤️ Fetching weather forecast...");
        const weatherResponse = await apiService.getWeatherForecast(
          tripData.destination
        );
        console.log("✅ Weather fetched successfully:", weatherResponse);
        setWeather(weatherResponse.forecast);
      } catch (weatherError) {
        console.warn(
          "⚠️ Weather fetch failed, continuing without weather:",
          weatherError
        );
        // ממשיכים בלי מזג אוויר אם יש בעיה
        setWeather(null);
      }

      setStep("preview");
    } catch (error) {
      console.error("❌ Trip generation error:", error);
      setError(error.message || "שגיאה ביצירת המסלול. אנא נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  // שמירת מסלול

  const handleSaveTrip = async (tripMetadata) => {
    setLoading(true);
    setError("");

    try {
      // הכנת נתונים נקיים לשמירה
      const tripToSave = {
        // נתונים בסיסיים
        name:
          tripMetadata.name?.trim() ||
          `מסלול ${currentTrip.tripType === "bike" ? "אופניים" : "הליכה"} ב${
            currentTrip.destination.city || currentTrip.destination.country
          }`,
        description: tripMetadata.description?.trim() || "",

        // יעד
        destination: {
          country: currentTrip.destination.country,
          city: currentTrip.destination.city || "",
          coordinates: currentTrip.destination.coordinates || [],
        },

        // סוג טיול
        tripType:
          currentTrip.tripType === "trek" ? "walk" : currentTrip.tripType,

        // מסלולים - ניקוי מדויק
        routes: currentTrip.routes.map((route) => ({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: route.geometry.coordinates,
          },
          properties: {
            distance: route.properties.distance || 0,
            duration: route.properties.duration || 0,
            day: route.properties.day || 1,
            description: route.properties.description || "",
            waypoints: route.properties.waypoints || [],
            startCity: route.properties.startCity || "",
            endCity: route.properties.endCity || "",
            circular: route.properties.circular || false,
          },
        })),

        // פרטים נוספים
        title: currentTrip.title || "",
        totalDistance: currentTrip.totalDistance || 0,
        duration: currentTrip.duration || "יום אחד",
        difficulty: currentTrip.difficulty || "בינוני",
        source: "Real Routing API", // ערך מותר במסד הנתונים
        routing: {
          engine: "OSRM",
          realRoads: true,
          quality: "high",
        },
      };

      console.log("📤 שולח נתוני טיול לשמירה:", tripToSave);

      await apiService.saveTrip(tripToSave);

      alert("המסלול נשמר בהצלחה!");
      setStep("saved");
    } catch (error) {
      console.error("❌ שגיאה בשמירת המסלול:", error);
      setError("שגיאה בשמירת המסלול. אנא נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  // איפוס הטופס
  const handleReset = () => {
    setCurrentTrip(null);
    setWeather(null);
    setError("");
    setStep("form");
    setTripGenerationCount((prev) => prev + 1); // רק זה נוסף לתיקון
  };

  return (
    <div className="trip-planner">
      <div className="trip-planner-header">
        <h1>🗺️ תכנון מסלול חדש</h1>
        <p>צרו מסלול טיול מותאם אישית עם מפות ותחזית מזג אוויר</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      <div className="trip-planner-content">
        {step === "form" && (
          <TripForm
            key={tripGenerationCount}
            onGenerate={handleGenerateTrip}
            loading={loading}
          />
        )}

        {step === "preview" && currentTrip && (
          <div className="trip-preview">
            <div className="trip-preview-header">
              <h2>📍 המסלול שלכם מוכן!</h2>
              <div className="trip-preview-actions">
                <button onClick={handleReset} className="btn btn-secondary">
                  יצירת מסלול חדש
                </button>
                <button
                  onClick={() => setStep("save")}
                  className="btn btn-primary"
                >
                  שמירת המסלול
                </button>
              </div>
            </div>

            <div className="trip-preview-grid">
              <div className="trip-preview-map">
                <TripMap trip={currentTrip} interactive={true} />
              </div>

              <div className="trip-preview-details">
                <TripSummary trip={currentTrip} />

                {weather && (
                  <WeatherDisplay
                    weather={weather}
                    destination={currentTrip.destination}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {step === "save" && currentTrip && (
          <div className="trip-save">
            <div className="trip-save-form">
              <h3>שמירת המסלול</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleSaveTrip({
                    name: formData.get("tripName"),
                    description: formData.get("tripDescription"),
                  });
                }}
              >
                <div className="form-group">
                  <label htmlFor="tripName">שם המסלול:</label>
                  <input
                    type="text"
                    id="tripName"
                    name="tripName"
                    required
                    placeholder={`מסלול ${
                      currentTrip.tripType === "bike" ? "אופניים" : "טרק"
                    } ב${
                      currentTrip.destination.city ||
                      currentTrip.destination.country
                    }`}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tripDescription">תיאור קצר:</label>
                  <textarea
                    id="tripDescription"
                    name="tripDescription"
                    rows="3"
                    placeholder="תיאור קצר של המסלול והחוויה הצפויה..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setStep("preview")}
                    className="btn btn-secondary"
                  >
                    חזרה
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "שומר..." : "שמירת המסלול"}
                  </button>
                </div>
              </form>
            </div>

            <div className="trip-save-preview">
              <TripMap trip={currentTrip} interactive={false} height="300px" />
            </div>
          </div>
        )}

        {step === "saved" && (
          <div className="trip-saved">
            <div className="success-message">
              <h2>✅ המסלול נשמר בהצלחה!</h2>
              <p>תוכלו למצוא את המסלול בדף "המסלולים שלי"</p>
              <div className="success-actions">
                <button onClick={handleReset} className="btn btn-primary">
                  יצירת מסלול חדש
                </button>
                <button
                  onClick={() => (window.location.href = "/my-trips")}
                  className="btn btn-secondary"
                >
                  צפייה במסלולים שלי
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>
              {step === "form" && "יוצר מסלול מותאם אישית..."}
              {step === "save" && "שומר את המסלול..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
