import axios from "axios";

// יצירת axios client
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 120000,
});

// Interceptor לטיפול בשגיאות
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized - redirecting to login");
    }
    return Promise.reject(error);
  }
);

class ApiService {
  // === Trip Services ===

  // יצירת מסלול חדש עם LLM
  async generateTrip(destination, tripType) {
    try {
      const response = await apiClient.post("/trips/generate", {
        destination,
        tripType,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // שמירת מסלול
  async saveTrip(tripData) {
    try {
      const response = await apiClient.post("/trips/save", tripData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // קבלת רשימת הטיולים של המשתמש
  async getUserTrips(page = 1, limit = 10) {
    try {
      const response = await apiClient.get("/trips/my-trips", {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // קבלת טיול ספציפי
  async getTripById(tripId) {
    try {
      const response = await apiClient.get(`/trips/${tripId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // עדכון טיול
  async updateTrip(tripId, updateData) {
    try {
      const response = await apiClient.put(`/trips/${tripId}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // מחיקת טיול
  async deleteTrip(tripId) {
    try {
      const response = await apiClient.delete(`/trips/${tripId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // === Weather Services ===

  // תחזית מזג אוויר לשלושה ימים
  async getWeatherForecast(location) {
    try {
      const params =
        location.lat && location.lon
          ? { lat: location.lat, lon: location.lon }
          : { city: location.city, country: location.country };

      const response = await apiClient.get("/weather/forecast", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // מזג אוויר נוכחי
  async getCurrentWeather(location) {
    try {
      const params =
        location.lat && location.lon
          ? { lat: location.lat, lon: location.lon }
          : { city: location.city, country: location.country };

      const response = await apiClient.get("/weather/current", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // === Utility Methods ===

  // טיפול בשגיאות
  handleError(error) {
    if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    } else if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error("שגיאה לא צפויה");
    }
  }

  // בדיקת זמינות השרת
  async healthCheck() {
    try {
      const response = await apiClient.get("/test");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // === Helper Methods for Frontend ===

  // המרת נתוני מסלול לפורמט GeoJSON
  formatRouteForMap(route) {
    if (!route || !route.features) return null;

    return {
      type: "FeatureCollection",
      features: route.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          // הוספת סגנון לכל יום
          color: this.getDayColor(feature.properties.day),
          weight: 4,
          opacity: 0.8,
        },
      })),
    };
  }

  // קבלת צבע לכל יום במסלול
  getDayColor(day) {
    const colors = [
      "#3388ff", // כחול
      "#ff3333", // אדום
      "#33ff33", // ירוק
      "#ffff33", // צהוב
      "#ff33ff", // מגנטה
      "#33ffff", // ציאן
    ];
    return colors[(day - 1) % colors.length];
  }

  // חישוב גבולות המפה לפי המסלול
  calculateMapBounds(route) {
    if (!route?.features?.length) return null;

    let minLat = Infinity,
      maxLat = -Infinity;
    let minLon = Infinity,
      maxLon = -Infinity;

    route.features.forEach((feature) => {
      if (feature.geometry?.coordinates) {
        feature.geometry.coordinates.forEach((coord) => {
          const [lon, lat] = coord;
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
        });
      }
    });

    if (minLat === Infinity) return null;

    return [
      [minLat, minLon],
      [maxLat, maxLon],
    ];
  }

  // פורמט תאריך לתצוגה
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // פורמט מרחק לתצוגה
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} מטר`;
    }
    return `${distance.toFixed(1)} ק"מ`;
  }
}

// יצוא instance יחיד של השירות
export const apiService = new ApiService();
