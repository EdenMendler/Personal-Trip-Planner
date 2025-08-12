import React, { useEffect, useState } from "react";
import "./TripSummary.css";

const TripSummary = ({ trip, onSave, onEdit, onClose }) => {
  const [destinationImage, setDestinationImage] = useState(null);

  // הפונקציה לטעינת תמונה מהשרת
  useEffect(() => {
    if (trip && trip.destination) {
      fetchDestinationImage(trip.destination);
    }
  }, [trip]);

  // פונקציה לטעינת תמונה מהשרת
  const fetchDestinationImage = async (destination) => {
    try {
      // הנתיב נשאר זהה על אף שהקובץ עבר מיקום - API path לא משתנה
      const response = await fetch(
        `/api/images/destination?country=${destination.country}${
          destination.city ? `&city=${destination.city}` : ""
        }`
      );
      if (response.ok) {
        const imageData = await response.json();
        setDestinationImage(imageData);
      }
    } catch (error) {
      console.log("שגיאה בטעינת תמונה:", error);
    }
  };

  if (!trip) {
    return (
      <div className="trip-summary">
        <div className="no-trip">אין נתוני טיול להצגה</div>
      </div>
    );
  }

  // הפונקציה המקורית להערכת זמן
  const getEstimatedTime = () => {
    const timeText = trip.tripType === "bike" ? "2-4 שעות" : "3-5 שעות";
    return timeText;
  };

  // חישוב סטטיסטיקות כפי שהיה במקור
  const calculateStats = () => {
    if (!trip.routes || trip.routes.length === 0) {
      return {
        totalDistance: 0,
        totalDuration: 0,
        dailyBreakdown: [],
        averageDistance: 0,
        routingEngine: "Unknown",
      };
    }

    // יצירת מפה לפי ימים כדי למנוע כפילויות
    const dayMap = new Map();

    trip.routes.forEach((route) => {
      const day = route.properties?.day || 1;
      const routeData = {
        day: day,
        distance: route.properties?.distance || 0,
        duration: route.properties?.duration || 0,
        description: route.properties?.description || "",
        routingEngine: route.properties?.routingEngine || "Unknown",
      };

      if (dayMap.has(day)) {
        const existing = dayMap.get(day);
        dayMap.set(day, {
          ...existing,
          ...routeData,
          distance: Math.max(existing.distance, routeData.distance),
        });
      } else {
        dayMap.set(day, routeData);
      }
    });

    const dailyBreakdown = Array.from(dayMap.values()).sort(
      (a, b) => a.day - b.day
    );

    const totalDistance = dailyBreakdown.reduce(
      (sum, day) => sum + day.distance,
      0
    );
    const totalDuration = dailyBreakdown.reduce(
      (sum, day) => sum + day.duration,
      0
    );

    return {
      totalDistance,
      totalDuration,
      dailyBreakdown,
      averageDistance: dailyBreakdown.length
        ? Math.round(totalDistance / dailyBreakdown.length)
        : 0,
      routingEngine:
        dailyBreakdown.length > 0 ? dailyBreakdown[0].routingEngine : "Unknown",
    };
  };

  const stats = calculateStats();

  return (
    <div className="trip-summary">
      <div className="trip-header">
        <h2>
          {trip.destination.city
            ? `${trip.destination.city}, ${trip.destination.country}`
            : trip.destination.country}
        </h2>
        <div className="trip-subtitle">
          <span>
            {trip.tripType === "bike" ? "🚴‍♂️ טיול אופניים" : "🥾 מסלול הליכה"}
          </span>
          <span>•</span>
          <span>
            {stats.dailyBreakdown.length > 1
              ? `${stats.dailyBreakdown.length} ימים`
              : "יום אחד"}
          </span>
          <span>•</span>
          <span>{stats.totalDistance} ק"מ</span>
        </div>
      </div>

      {/* תמונת היעד */}
      {destinationImage && (
        <div className="trip-image">
          <h4>🖼️ {trip.destination.city || trip.destination.country}</h4>
          <div className="image-container">
            <img
              src={destinationImage.url}
              alt={destinationImage.alt}
              className="destination-image"
            />
            <div className="image-credit">
              צילום: {destinationImage.credit.photographer} /{" "}
              {destinationImage.credit.source}
            </div>
          </div>
        </div>
      )}

      {/* סטטיסטיקות */}
      <div className="trip-stats">
        <h3>📊 נתוני מסלול</h3>
        <div className="trip-stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.totalDistance}</span>
            <span className="stat-label">ק"מ סה"כ</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {stats.dailyBreakdown.length > 1
                ? stats.dailyBreakdown.length
                : stats.dailyBreakdown.length === 1
                ? "1"
                : "0"}
            </span>
            <span className="stat-label">ימים</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.averageDistance}</span>
            <span className="stat-label">ק"מ ממוצע ליום</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {trip.tripType === "bike" ? "🚴‍♂️" : "🥾"}
            </span>
            <span className="stat-label">סוג מסלול</span>
          </div>
        </div>
      </div>

      {/* פרטי המסלול ליום */}
      {stats.dailyBreakdown.length > 0 && (
        <div className="daily-breakdown">
          <h3>🗓️ פרטי המסלול</h3>
          {stats.dailyBreakdown.map((dayInfo, index) => (
            <div key={index} className="day-summary">
              <div className="day-header">
                <h4>
                  יום {dayInfo.day}
                  {trip.tripType === "bike" && dayInfo.day === 1 && " - התחלה"}
                  {trip.tripType === "bike" && dayInfo.day === 2 && " - סיום"}
                </h4>
                <div className="day-stats">📏 {dayInfo.distance} ק"מ</div>
                <div className="day-duration">
                  ⏱️{" "}
                  {dayInfo.duration && dayInfo.duration > 0
                    ? `${dayInfo.duration} דקות`
                    : getEstimatedTime()}
                </div>
              </div>

              <div className="day-description">
                <p>{dayInfo.description}</p>
              </div>

              <div className="day-details">
                <div className="routing-info">
                  <span className="routing-engine">
                    🛣️{" "}
                    {dayInfo.routingEngine === "OSRM"
                      ? "מסלול אמיתי"
                      : dayInfo.routingEngine === "Google Maps"
                      ? "Google Maps"
                      : dayInfo.routingEngine === "basic-fallback"
                      ? "מסלול בסיסי"
                      : "מסלול מותאם"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* דרישות מסלול */}
      {trip.tripType === "bike" && (
        <div className="trip-constraints">
          <h4>🚴‍♂️ דרישות מסלול אופניים</h4>
          <div className="constraints-list">
            <div className="constraint-item">
              <span className="constraint-icon">📏</span>
              <span>עד 60 ק"מ ליום</span>
              <span
                className={`constraint-status ${
                  stats.dailyBreakdown.every((day) => day.distance <= 60)
                    ? "valid"
                    : "invalid"
                }`}
              >
                {stats.dailyBreakdown.every((day) => day.distance <= 60)
                  ? "✅"
                  : "❌"}
              </span>
            </div>
            <div className="constraint-item">
              <span className="constraint-icon">📅</span>
              <span>2 ימים רציפים</span>
              <span
                className={`constraint-status ${
                  stats.dailyBreakdown.length === 2 ? "valid" : "invalid"
                }`}
              >
                {stats.dailyBreakdown.length === 2 ? "✅" : "❌"}
              </span>
            </div>
            <div className="constraint-item">
              <span className="constraint-icon">🏙️</span>
              <span>מעיר לעיר</span>
              <span className="constraint-status valid">✅</span>
            </div>
          </div>
        </div>
      )}

      {trip.tripType === "walk" && (
        <div className="trip-constraints">
          <h4>🥾 דרישות מסלול הליכה</h4>
          <div className="constraints-list">
            <div className="constraint-item">
              <span className="constraint-icon">📏</span>
              <span>בין 5-15 ק"מ</span>
              <span
                className={`constraint-status ${
                  stats.totalDistance >= 5 && stats.totalDistance <= 15
                    ? "valid"
                    : stats.totalDistance < 5 || stats.totalDistance > 15
                    ? "invalid"
                    : "warning"
                }`}
              >
                {stats.totalDistance >= 5 && stats.totalDistance <= 15
                  ? "✅"
                  : stats.totalDistance < 5
                  ? "❌ קצר מדי"
                  : stats.totalDistance > 15
                  ? "❌ ארוך מדי"
                  : "⚠️"}
              </span>
            </div>
            <div className="constraint-item">
              <span className="constraint-icon">🔄</span>
              <span>מסלול מעגלי</span>
              <span className="constraint-status valid">✅</span>
            </div>
            <div className="constraint-item">
              <span className="constraint-icon">📅</span>
              <span>יום אחד</span>
              <span
                className={`constraint-status ${
                  stats.dailyBreakdown.length === 1 ? "valid" : "invalid"
                }`}
              >
                {stats.dailyBreakdown.length === 1 ? "✅" : "❌"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* המלצות מותאמות */}
      <div className="trip-recommendations">
        <h4>💡 המלצות מותאמות</h4>
        <div className="recommendations-list">
          {trip.tripType === "bike" ? (
            <>
              <div className="recommendation-item">
                <span className="recommendation-icon">⛑️</span>
                <span>קחו קסדה וציוד בטיחות</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-icon">🔧</span>
                <span>הצטיידו בערכת תיקון פנצ'רים</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-icon">🧴</span>
                <span>הגנו על העור מהשמש</span>
              </div>
            </>
          ) : (
            <>
              <div className="recommendation-item">
                <span className="recommendation-icon">👟</span>
                <span>נעלו נעלי הליכה נוחות</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-icon">💧</span>
                <span>הצטיידו בלפחות 2 ליטר מים</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-icon">🥪</span>
                <span>קחו אוכל קל לדרך</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* מידע טכני */}
      <div className="technical-info">
        <h4>🛠️ פרטים טכניים</h4>
        <div className="tech-details">
          <div className="tech-item">
            <span className="tech-label">מנוע ניתוב:</span>
            <span className="tech-value">{stats.routingEngine}</span>
          </div>
          <div className="tech-item">
            <span className="tech-label">רמת דיוק:</span>
            <span className="tech-value">
              {stats.routingEngine === "OSRM" ? "גבוהה" : "בסיסית"}
            </span>
          </div>
          <div className="tech-item">
            <span className="tech-label">כבישים אמיתיים:</span>
            <span className="tech-value">
              {trip.routing?.realRoads ? "כן" : "לא"}
            </span>
          </div>
          <div className="tech-item">
            <span className="tech-label">פילוח ימים:</span>
            <div className="day-breakdown-tech">
              {stats.dailyBreakdown.map((day, index) => (
                <span key={index} className="day-tech">
                  יום {day.day}: {day.distance}ק"מ
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* כפתורי פעולה */}
      <div className="trip-actions">
        {onSave && (
          <button className="save-btn" onClick={onSave}>
            💾 שמור טיול
          </button>
        )}
        {onEdit && (
          <button className="edit-btn" onClick={onEdit}>
            ✏️ ערוך
          </button>
        )}
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ❌ סגור
          </button>
        )}
      </div>
    </div>
  );
};

export default TripSummary;
