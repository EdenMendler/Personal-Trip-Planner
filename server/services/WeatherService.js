const axios = require("axios");

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = "https://api.openweathermap.org/data/2.5";

    if (!this.apiKey) {
      console.warn(
        "OpenWeather API key not found. Weather features will not work."
      );
    }
  }

  // קבלת תחזית לשלושה ימים לפי קואורדינטות
  async getForecastByCoordinates(lat, lon) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: "metric", // צלזיוס
          cnt: 40, // הגדלה ל-40 תחזיות (5 ימים * 8 תחזיות ביום)
        },
      });

      return this.formatForecastData(response.data);
    } catch (error) {
      console.error(
        "Weather forecast error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch weather forecast");
    }
  }

  // קבלת תחזית לשלושה ימים לפי שם מקום
  async getForecastByLocation(city, country) {
    try {
      const location = country ? `${city},${country}` : city;
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: location,
          appid: this.apiKey,
          units: "metric",
          cnt: 40, // הגדלה ל-40 תחזיות (5 ימים * 8 תחזיות ביום)
        },
      });

      return this.formatForecastData(response.data);
    } catch (error) {
      console.error(
        "Weather forecast error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch weather forecast");
    }
  }

  // קבלת מזג אוויר נוכחי לפי קואורדינטות
  async getCurrentWeatherByCoordinates(lat, lon) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: "metric",
        },
      });

      return this.formatCurrentWeatherData(response.data);
    } catch (error) {
      console.error(
        "Current weather error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch current weather");
    }
  }

  // קבלת מזג אוויר נוכחי לפי שם מקום
  async getCurrentWeatherByLocation(city, country) {
    try {
      const location = country ? `${city},${country}` : city;
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: location,
          appid: this.apiKey,
          units: "metric",
        },
      });

      return this.formatCurrentWeatherData(response.data);
    } catch (error) {
      console.error(
        "Current weather error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch current weather");
    }
  }

  // עיצוב נתוני תחזית לשלושה ימים
  formatForecastData(data) {
    const dailyForecasts = [];
    const forecastsByDay = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // קיבוץ התחזיות לפי יום
    data.list.forEach((forecast) => {
      const date = new Date(forecast.dt * 1000);
      const dayKey = date.toDateString();

      if (!forecastsByDay[dayKey]) {
        forecastsByDay[dayKey] = [];
      }
      forecastsByDay[dayKey].push(forecast);
    });

    const futureDays = Object.keys(forecastsByDay).filter((dayKey) => {
      const forecastDate = new Date(dayKey);
      forecastDate.setHours(0, 0, 0, 0);
      return forecastDate > today;
    });

    // יצירת תחזית יומית מסוכמת לשלושה ימים הבאים
    futureDays
      .slice(0, 3) // לקיחת 3 ימים עתידיים בלבד
      .forEach((dayKey) => {
        const dayForecasts = forecastsByDay[dayKey];
        const date = new Date(dayKey);

        // חישוב ממוצעים ומקסימום/מינימום
        const temps = dayForecasts.map((f) => f.main.temp);
        const descriptions = dayForecasts.map((f) => f.weather[0].description);
        const icons = dayForecasts.map((f) => f.weather[0].icon);

        // בחירת האייקון הנפוץ ביותר
        const iconCounts = {};
        icons.forEach(
          (icon) => (iconCounts[icon] = (iconCounts[icon] || 0) + 1)
        );
        const mostCommonIcon = Object.keys(iconCounts).reduce((a, b) =>
          iconCounts[a] > iconCounts[b] ? a : b
        );

        dailyForecasts.push({
          date: date.toISOString().split("T")[0],
          dayName: date.toLocaleDateString("he-IL", { weekday: "long" }),
          temperature: {
            min: Math.round(Math.min(...temps)),
            max: Math.round(Math.max(...temps)),
            avg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
          },
          humidity: Math.round(
            dayForecasts.reduce((sum, f) => sum + f.main.humidity, 0) /
              dayForecasts.length
          ),
          description: descriptions[0],
          icon: mostCommonIcon,
          windSpeed: Math.round(
            dayForecasts.reduce((sum, f) => sum + f.wind.speed, 0) /
              dayForecasts.length
          ),
          precipitation: dayForecasts.some((f) => f.rain || f.snow)
            ? dayForecasts.reduce(
                (sum, f) => sum + (f.rain?.["3h"] || f.snow?.["3h"] || 0),
                0
              )
            : 0,
        });
      });

    return {
      city: data.city,
      forecast: dailyForecasts,
      generatedAt: new Date().toISOString(),
    };
  }

  // עיצוב נתוני מזג אוויר נוכחי
  formatCurrentWeatherData(data) {
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        coordinates: data.coord,
      },
      current: {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: Math.round(data.wind.speed),
        visibility: data.visibility,
        pressure: data.main.pressure,
        cloudiness: data.clouds.all,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // בדיקה אם השירות זמין
  isAvailable() {
    return !!this.apiKey;
  }
}

module.exports = new WeatherService();
