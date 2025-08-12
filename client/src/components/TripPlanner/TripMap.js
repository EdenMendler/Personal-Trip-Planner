import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// תיקון אייקונים של Leaflet ב-React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const TripMap = ({ trip, interactive = true, height = "500px" }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!trip || !trip.routes) return;

    // יצירת המפה אם לא קיימת
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        scrollWheelZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
      });

      // הוספת שכבת המפה
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // ניקוי שכבות קיימות
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // צבעים מותאמים לימים שונים
    const getDayColor = (dayNumber) => {
      const colors = {
        1: "#FF6B6B", // אדום ליום 1
        2: "#4ECDC4", // טורקיז ליום 2
        3: "#45B7D1", // כחול
        4: "#96CEB4", // ירוק
        5: "#FFEAA7", // צהוב
      };
      return colors[dayNumber] || "#999999";
    };

    let allCoordinates = [];

    // הוספת המסלולים למפה לפי ימים
    trip.routes.forEach((route, index) => {
      const dayNumber = route.properties?.day || index + 1;
      const color = getDayColor(dayNumber);

      if (route.geometry && route.geometry.coordinates) {
        const coordinates = route.geometry.coordinates.map((coord) => [
          coord[1],
          coord[0],
        ]); // המרה מ-[lon, lat] ל-[lat, lon]
        allCoordinates = allCoordinates.concat(coordinates);

        // יצירת קו המסלול
        const polyline = L.polyline(coordinates, {
          color: color,
          weight: 5,
          opacity: 0.8,
          smoothFactor: 1,
        }).addTo(map);

        // הוספת popup למסלול
        const popupContent = `
          <div class="route-popup">
            <h4>יום ${dayNumber} - ${
          route.properties.description || "מסלול"
        }</h4>
            <p><strong>מרחק:</strong> ${route.properties.distance} ק"מ</p>
            <p><strong>משך זמן:</strong> ${
              route.properties.duration || "לא זמין"
            } דקות</p>
            ${
              route.properties.waypoints
                ? `
              <div class="waypoints">
                <strong>נקודות עניין:</strong>
                <ul>
                  ${route.properties.waypoints
                    .map((wp) => `<li>${wp}</li>`)
                    .join("")}
                </ul>
              </div>
            `
                : ""
            }
          </div>
        `;
        polyline.bindPopup(popupContent);

        // סמנים לנקודות התחלה וסיום עם מספור
        if (coordinates.length > 0) {
          // נקודת התחלה של כל יום
          const startIcon = L.divIcon({
            className: "custom-marker start-marker",
            html: `<div class="marker-content">${dayNumber}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

          L.marker(coordinates[0], { icon: startIcon })
            .addTo(map)
            .bindPopup(
              `התחלת יום ${dayNumber} - ${
                route.properties.description || "מסלול"
              }`
            );

          // נקודת סיום (רק למסלולי אופניים ורק ליום האחרון)
          if (
            trip.tripType === "bike" &&
            dayNumber ===
              Math.max(...trip.routes.map((r) => r.properties?.day || 1))
          ) {
            const endIcon = L.divIcon({
              className: "custom-marker end-marker",
              html: '<div class="marker-content">E</div>',
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });

            L.marker(coordinates[coordinates.length - 1], { icon: endIcon })
              .addTo(map)
              .bindPopup(`נקודת סיום הטיול`);
          }
        }
      }
    });

    // התאמת המפה לכל המסלולים
    if (allCoordinates.length > 0) {
      const bounds = L.latLngBounds(allCoordinates);
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    // הוספת סמן ליעד הראשי
    if (trip.destination && trip.destination.coordinates) {
      const [lon, lat] = trip.destination.coordinates;

      const destinationIcon = L.divIcon({
        className: "custom-marker destination-marker",
        html: '<div class="marker-content">📍</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([lat, lon], { icon: destinationIcon }).addTo(map).bindPopup(`
          <div class="destination-popup">
            <h3>${trip.destination.city}, ${trip.destination.country}</h3>
            <p>יעד הטיול</p>
          </div>
        `);
    }

    // ניקוי בעת unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [trip, interactive]);

  // יצירת לגנדה דינמית לפי המסלולים הקיימים
  const generateLegend = () => {
    if (!trip || !trip.routes) return null;

    const uniqueDays = [
      ...new Set(trip.routes.map((route) => route.properties?.day || 1)),
    ].sort();

    const getDayColor = (dayNumber) => {
      const colors = {
        1: "#FF6B6B",
        2: "#4ECDC4",
        3: "#45B7D1",
        4: "#96CEB4",
        5: "#FFEAA7",
      };
      return colors[dayNumber] || "#999999";
    };

    return (
      <div className="map-legend">
        {uniqueDays.map((day) => (
          <div key={day} className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: getDayColor(day) }}
            ></div>
            <span>מסלול יום {day}</span>
          </div>
        ))}

        <div className="legend-item">
          <div className="legend-marker start-marker-legend"></div>
          <span>נקודות התחלה</span>
        </div>

        {trip.tripType === "bike" && (
          <div className="legend-item">
            <div className="legend-marker end-marker-legend"></div>
            <span>נקודת סיום</span>
          </div>
        )}
      </div>
    );
  };

  if (!trip) {
    return (
      <div className="map-placeholder" style={{ height }}>
        <div className="map-placeholder-content">
          <h3>🗺️ המפה תופיע כאן</h3>
          <p>צרו מסלול כדי לראות את המפה האינטראקטיבית</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-map-container">
      <div className="trip-map-header">
        <h3>
          🗺️ מפת המסלול - {trip.destination.city}, {trip.destination.country}
        </h3>
        <div className="trip-map-info">
          <span className="trip-type">
            {trip.tripType === "bike" ? "🚴‍♂️ אופניים" : "🥾 טרק רגלי"}
          </span>
          <span className="trip-distance">
            📏 {trip.totalDistance || "N/A"} ק"מ
          </span>
          {trip.duration && (
            <span className="trip-duration">⏱️ {trip.duration}</span>
          )}
        </div>
      </div>

      <div
        ref={mapRef}
        className="trip-map"
        style={{ height, width: "100%" }}
      />

      {generateLegend()}
    </div>
  );
};

export default TripMap;
