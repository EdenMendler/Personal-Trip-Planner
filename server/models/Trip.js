const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Trip name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    destination: {
      country: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: "Invalid coordinates format",
        },
      },
    },
    tripType: {
      type: String,
      required: true,
      enum: ["walk", "bike", "trek"],
    },
    routes: [
      {
        type: {
          type: String,
          enum: ["Feature"],
          default: "Feature",
        },
        geometry: {
          type: {
            type: String,
            enum: ["LineString"],
            required: true,
          },
          coordinates: {
            type: [[Number]], // Array of [longitude, latitude] pairs
            required: true,
            validate: {
              validator: function (coords) {
                return (
                  coords.length >= 2 &&
                  coords.every(
                    (coord) =>
                      Array.isArray(coord) &&
                      coord.length === 2 &&
                      coord[0] >= -180 &&
                      coord[0] <= 180 &&
                      coord[1] >= -90 &&
                      coord[1] <= 90
                  )
                );
              },
              message: "Route must have at least 2 valid coordinate pairs",
            },
          },
        },
        properties: {
          day: {
            type: Number,
            default: 1,
          },
          distance: {
            type: Number, // בקילומטרים
            required: true,
            min: [0, "Distance cannot be negative"],
          },
          duration: {
            type: Number, // בדקות
            min: [0, "Duration cannot be negative"],
          },
          description: {
            type: String,
            trim: true,
          },
          waypoints: [String], // נקודות עניין במסלול
          routingEngine: {
            type: String,
            enum: ["OSRM", "Google Maps", "fallback"],
            default: "OSRM",
          },
          profile: {
            type: String,
            enum: ["foot", "cycling"],
          },
        },
      },
    ],
    totalDistance: {
      type: Number,
      min: [0, "Total distance cannot be negative"],
    },
    duration: {
      type: String, // "יום אחד", "2 ימים" וכו'
    },
    source: {
      type: String,
      enum: ["Real Routing API", "Enhanced Fallback", "Groq AI Research"],
      default: "Real Routing API",
    },
    routing: {
      engine: String,
      realRoads: {
        type: Boolean,
        default: true,
      },
      quality: {
        type: String,
        enum: ["high", "fallback"],
        default: "high",
      },
    },
    status: {
      type: String,
      enum: ["draft", "saved", "completed"],
      default: "saved",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ "destination.country": 1 });
tripSchema.index({ tripType: 1 });

// Virtual for calculating total distance if not provided
tripSchema.virtual("calculatedTotalDistance").get(function () {
  if (this.totalDistance) return this.totalDistance;

  return this.routes.reduce((total, route) => {
    return total + (route.properties?.distance || 0);
  }, 0);
});

// Method to validate trip constraints
tripSchema.methods.validateTripConstraints = function () {
  const errors = [];

  if (this.tripType === "bike") {
    // אופניים: עד 60 ק"מ ביום, מקסימום 2 ימים
    this.routes.forEach((route, index) => {
      if (route.properties.distance > 60) {
        errors.push(
          `Route ${index + 1} distance (${
            route.properties.distance
          }km) exceeds 60km limit for bike trips`
        );
      }
    });

    if (this.routes.length > 2) {
      errors.push("Bike trips cannot have more than 2 route segments");
    }
  } else if (this.tripType === "walk") {
    // הליכה: 5-15 ק"מ בדרך כלל
    this.routes.forEach((route, index) => {
      const distance = route.properties.distance;
      if (distance > 25) {
        // מגבלה רחבה יותר להליכה
        errors.push(
          `Route ${
            index + 1
          } distance (${distance}km) is quite long for a walking trip`
        );
      }
    });
  }

  // בדיקת תקינות קואורדינטות
  this.routes.forEach((route, routeIndex) => {
    if (!route.geometry.coordinates || route.geometry.coordinates.length < 2) {
      errors.push(
        `Route ${routeIndex + 1} must have at least 2 coordinate points`
      );
    }
  });

  return errors;
};

// Method to get trip summary
tripSchema.methods.getSummary = function () {
  return {
    id: this._id,
    name:
      this.name ||
      `${this.tripType} trip to ${
        this.destination.city || this.destination.country
      }`,
    destination: this.destination,
    tripType: this.tripType,
    totalDistance: this.calculatedTotalDistance,
    duration: this.duration,
    routeCount: this.routes.length,
    quality: this.routing?.quality || "unknown",
    createdAt: this.createdAt,
  };
};

// Method to check if trip uses real roads
tripSchema.methods.usesRealRoads = function () {
  return this.routing?.realRoads === true && this.source === "Real Routing API";
};

// Pre-save middleware to calculate total distance
tripSchema.pre("save", function (next) {
  if (!this.totalDistance && this.routes.length > 0) {
    this.totalDistance = this.calculatedTotalDistance;
  }

  // Set default name if not provided
  if (!this.name) {
    const destination = this.destination.city || this.destination.country;
    const type = this.tripType === "bike" ? "רכיבה" : "הליכה";
    this.name = `${type} ב${destination}`;
  }

  next();
});

// Virtual for trip summary (backwards compatibility)
tripSchema.virtual("summary").get(function () {
  return this.getSummary();
});

// Ensure virtual fields are included in JSON output
tripSchema.set("toJSON", { virtuals: true });
tripSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Trip", tripSchema);
