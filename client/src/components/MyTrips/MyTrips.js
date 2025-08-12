import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import TripMap from "../TripPlanner/TripMap";
import TripSummary from "../TripPlanner/TripSummary";
import WeatherDisplay from "../TripPlanner/WeatherDisplay";
import "./MyTrips.css";

const MyTrips = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // טעינת הטיולים של המשתמש
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const response = await apiService.getUserTrips(page);
        setTrips(response.trips);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Error fetching trips:", error);
        setError(error.message || "שגיאה בטעינת המסלולים");
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [page]);

  // טעינת טיול בודד
  const handleTripSelect = async (trip) => {
    setSelectedTrip(trip);
    fetchTripWeather(trip);
  };

  // טעינת מזג אוויר לטיול שנבחר
  const fetchTripWeather = async (trip) => {
    setWeatherLoading(true);
    try {
      const weatherResponse = await apiService.getWeatherForecast(
        trip.destination
      );
      setWeather(weatherResponse.forecast);
    } catch (error) {
      console.warn("Error fetching weather, continuing without it:", error);
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  // סגירת טיול נבחר
  const handleCloseTrip = () => {
    setSelectedTrip(null);
    setWeather(null);
  };

  // מחיקת טיול
  const handleDeleteTrip = async (tripId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק את המסלול?")) {
      try {
        await apiService.deleteTrip(tripId);
        // עדכון רשימת הטיולים לאחר מחיקה
        setTrips(trips.filter((trip) => trip._id !== tripId));
        if (selectedTrip && selectedTrip._id === tripId) {
          setSelectedTrip(null);
          setWeather(null);
        }
      } catch (error) {
        console.error("Error deleting trip:", error);
        setError(error.message || "שגיאה במחיקת המסלול");
      }
    }
  };

  // מעבר בין עמודים
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  if (loading && trips.length === 0) {
    return (
      <div className="my-trips-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>טוען את המסלולים שלך...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-trips-container">
      <div className="my-trips-header">
        <h1>📑 המסלולים שלי</h1>
        <p>כאן יופיעו המסלולים השמורים שלכם</p>
        {error && (
          <div className="error-banner">
            <span>❌ {error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}
      </div>

      <div className="my-trips-content">
        {trips.length === 0 ? (
          <div className="no-trips-message">
            <h3>אין מסלולים שמורים עדיין</h3>
            <p>צור מסלול חדש כדי לראות אותו כאן</p>
            <a href="/trip-planner" className="btn btn-primary">
              יצירת מסלול חדש
            </a>
          </div>
        ) : (
          <div className="trips-grid">
            <div className="trips-list">
              <h3>המסלולים השמורים שלך</h3>
              <div className="trips-items">
                {trips.map((trip) => (
                  <div
                    key={trip._id}
                    className={`trip-item ${
                      selectedTrip?._id === trip._id ? "selected" : ""
                    }`}
                    onClick={() => handleTripSelect(trip)}
                  >
                    <div className="trip-item-header">
                      <h4>{trip.name}</h4>
                      <span className="trip-type-badge">
                        {trip.tripType === "bike" ? "🚲 אופניים" : "🚶 הליכה"}
                      </span>
                    </div>
                    <div className="trip-item-details">
                      <div className="trip-destination">
                        📍 {trip.destination.city || trip.destination.country}
                      </div>
                      <div className="trip-distance">
                        🛣️ {trip.totalDistance?.toFixed(1) || 0} ק"מ
                      </div>
                      <div className="trip-date">
                        📅{" "}
                        {new Date(trip.createdAt).toLocaleDateString("he-IL")}
                      </div>
                    </div>
                    <div className="trip-item-actions">
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(trip._id);
                        }}
                        title="מחק מסלול"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(page - 1)}
                    className="pagination-btn"
                  >
                    &lt; הקודם
                  </button>
                  <span className="pagination-info">
                    עמוד {pagination.currentPage} מתוך {pagination.totalPages}
                  </span>
                  <button
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(page + 1)}
                    className="pagination-btn"
                  >
                    הבא &gt;
                  </button>
                </div>
              )}
            </div>

            <div className="trip-details-view">
              {selectedTrip ? (
                <div className="selected-trip">
                  <div className="selected-trip-header">
                    <h3>{selectedTrip.name}</h3>
                    <button onClick={handleCloseTrip} className="close-btn">
                      ✕
                    </button>
                  </div>

                  <div className="selected-trip-map">
                    <TripMap trip={selectedTrip} interactive={true} />
                  </div>

                  <div className="selected-trip-content">
                    <div className="trip-info-panel">
                      <TripSummary trip={selectedTrip} />

                      {weather && (
                        <div className="trip-weather">
                          <h4>תחזית מזג אוויר עדכנית</h4>
                          <WeatherDisplay
                            weather={weather}
                            destination={selectedTrip.destination}
                          />
                        </div>
                      )}

                      {weatherLoading && (
                        <div className="weather-loading">
                          <div className="spinner-small"></div>
                          <span>טוען תחזית מזג אוויר...</span>
                        </div>
                      )}
                    </div>

                    {selectedTrip.description && (
                      <div className="trip-description">
                        <h4>תיאור המסלול</h4>
                        <p>{selectedTrip.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-trip-selected">
                  <h3>בחר מסלול מהרשימה כדי לראות פרטים</h3>
                  <p>לחץ על מסלול כדי להציג אותו על המפה</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTrips;
