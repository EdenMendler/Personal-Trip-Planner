// WeatherDisplay.js - קובץ מתוקן
import React from "react";

const WeatherDisplay = ({ weather, destination }) => {
  if (!weather || !weather.length) {
    return (
      <div className="weather-display">
        <h3>🌤️ תחזית מזג אוויר</h3>
        <div className="weather-error">
          <p>לא ניתן לטעון תחזית מזג אוויר כרגע</p>
        </div>
      </div>
    );
  }

  // המרת אייקונים של מזג אוויר לאמוג'י
  const getWeatherEmoji = (condition) => {
    const conditionMap = {
      clear: "☀️",
      sunny: "☀️",
      clouds: "☁️",
      cloudy: "☁️",
      "partly-cloudy": "⛅",
      rain: "🌧️",
      drizzle: "🌦️",
      storm: "⛈️",
      thunderstorm: "⛈️",
      snow: "❄️",
      mist: "🌫️",
      fog: "🌫️",
      wind: "💨",
      hot: "🔥",
      cold: "🥶",
    };

    const key = condition ? condition.toLowerCase() : "clear";
    return conditionMap[key] || "🌤️";
  };

  // המרת כיוון רוח
  const getWindDirection = (degrees) => {
    if (!degrees && degrees !== 0) return "לא ידוע";

    const directions = [
      "צפון",
      "צפון-מזרח",
      "מזרח",
      "דרום-מזרח",
      "דרום",
      "דרום-מערב",
      "מערב",
      "צפון-מערב",
    ];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // קבלת המלצות לטיול על פי מזג האוויר
  const getTripRecommendation = (dayWeather) => {
    // ניקח את הטמפרטורה הממוצעת או הנוכחית, תלוי במה יש
    const temp =
      typeof dayWeather.temperature === "object"
        ? dayWeather.temperature.avg
        : dayWeather.temperature;

    const condition =
      dayWeather.description?.toLowerCase() ||
      dayWeather.condition?.toLowerCase() ||
      "";
    const windSpeed = dayWeather.windSpeed || 0;

    if (condition.includes("rain") || condition.includes("storm")) {
      return { text: "מומלץ לדחות - גשם צפוי", level: "warning", icon: "⚠️" };
    }

    if (windSpeed > 25) {
      return {
        text: "רוח חזקה - זהירות באופניים",
        level: "caution",
        icon: "💨",
      };
    }

    if (temp < 5) {
      return { text: "קר מאוד - ביגוד חם נדרש", level: "caution", icon: "🧥" };
    }

    if (temp > 35) {
      return { text: "חם מאוד - התחילו מוקדם", level: "caution", icon: "🌡️" };
    }

    if (temp >= 15 && temp <= 25 && !condition.includes("rain")) {
      return { text: "תנאים מושלמים לטיול!", level: "excellent", icon: "✅" };
    }

    return { text: "תנאים טובים לטיול", level: "good", icon: "👍" };
  };

  // עיצוב תאריך - תיקון ימים ליום הנוכחי, מחר ומחרתיים
  const formatDate = (dateString, index) => {
    const today = new Date();
    const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

    // בהתבסס על האינדקס, נציג: מחר, מחרתיים, ואת היום שאחרי
    if (index === 0) {
      // היום הראשון (מחר)
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return `מחר (${dayNames[tomorrow.getDay()]})`;
    } else if (index === 1) {
      // היום השני (מחרתיים)
      const afterTomorrow = new Date(today);
      afterTomorrow.setDate(today.getDate() + 2);
      return `מחרתיים (${dayNames[afterTomorrow.getDay()]})`;
    } else {
      // היום השלישי (היום שאחרי מחרתיים)
      const thirdDay = new Date(today);
      thirdDay.setDate(today.getDate() + 3);
      const thirdDayName = dayNames[thirdDay.getDay()];
      return `יום ${thirdDayName}`;
    }
  };

  return (
    <div className="weather-display">
      <div className="weather-header">
        <h3>🌤️ תחזית מזג אוויר</h3>
        <p className="weather-location">
          📍 {destination.city}, {destination.country}
        </p>
        <p className="weather-note">* התחזית מיועדת למסלול המתחיל מחר</p>
      </div>

      <div className="weather-days">
        {[0, 1, 2].map((index) => {
          // מקבלים את היום המתאים מהמערך
          const dayWeather = index < weather.length ? weather[index] : null;

          if (!dayWeather) {
            return (
              <div key={index} className="weather-day weather-day-empty">
                <h4>{formatDate(null, index)}</h4>
                <p>נתוני מזג אוויר לא זמינים</p>
              </div>
            );
          }

          const recommendation = getTripRecommendation(dayWeather);

          // הצגת טמפרטורה בהתאם למבנה הנתונים
          let temperature, maxTemp, minTemp;

          if (typeof dayWeather.temperature === "object") {
            temperature = dayWeather.temperature.avg;
            maxTemp = dayWeather.temperature.max;
            minTemp = dayWeather.temperature.min;
          } else {
            temperature = dayWeather.temperature;
            maxTemp = dayWeather.maxTemp;
            minTemp = dayWeather.minTemp;
          }

          return (
            <div key={index} className="weather-day">
              <div className="weather-day-header">
                <h4>{formatDate(dayWeather.date, index)}</h4>
                <div className="weather-main">
                  <span className="weather-emoji">
                    {getWeatherEmoji(
                      dayWeather.condition ||
                        (dayWeather.icon &&
                          dayWeather.icon.replace(/[0-9n]/g, ""))
                    )}
                  </span>
                  <span className="weather-temp">{temperature}°C</span>
                </div>
              </div>

              <div className="weather-details">
                <div className="weather-detail-item">
                  <span className="detail-label">מצב:</span>
                  <span className="detail-value">
                    {dayWeather.description || dayWeather.condition}
                  </span>
                </div>

                <div className="weather-detail-item">
                  <span className="detail-label">טמפ' מקס/מין:</span>
                  <span className="detail-value">
                    {maxTemp}° / {minTemp}°
                  </span>
                </div>

                <div className="weather-detail-item">
                  <span className="detail-label">רוח:</span>
                  <span className="detail-value">
                    {dayWeather.windSpeed} קמ"ש
                    {dayWeather.windDirection &&
                      ` ${getWindDirection(dayWeather.windDirection)}`}
                  </span>
                </div>

                <div className="weather-detail-item">
                  <span className="detail-label">לחות:</span>
                  <span className="detail-value">{dayWeather.humidity}%</span>
                </div>

                {dayWeather.precipitation > 0 && (
                  <div className="weather-detail-item">
                    <span className="detail-label">גשם:</span>
                    <span className="detail-value">
                      {dayWeather.precipitation}מ"מ
                    </span>
                  </div>
                )}
              </div>

              <div className={`weather-recommendation ${recommendation.level}`}>
                <span className="recommendation-icon">
                  {recommendation.icon}
                </span>
                <span className="recommendation-text">
                  {recommendation.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="weather-tips">
        <h4>💡 טיפים למזג אוויר</h4>
        <div className="weather-tips-grid">
          <div className="tip-item">
            <span className="tip-icon">🧢</span>
            <span>כובע והגנה מהשמש</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">💧</span>
            <span>שתו הרבה מים</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🧥</span>
            <span>בגדים מתאימים לטמפרטורה</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">📱</span>
            <span>עקבו אחר עדכוני מזג האוויר</span>
          </div>
        </div>
      </div>

      <div className="weather-disclaimer">
        <p>
          <small>
            * התחזית מבוססת על נתונים מקוונים ועשויה להשתנות. מומלץ לוודא את
            תחזית מזג האוויר לפני יציאה לטיול.
          </small>
        </p>
      </div>
    </div>
  );
};

export default WeatherDisplay;
