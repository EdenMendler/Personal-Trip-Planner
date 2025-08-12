const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");

    // הגדרות חיבור למונגו
    const mongooseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout של 5 שניות
      socketTimeoutMS: 45000, // Timeout של 45 שניות
      maxPoolSize: 10, // מקסימום 10 חיבורים במאגר
      retryWrites: true,
      w: "majority",
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // האזנה לאירועי חיבור
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });

    // סגירה חלקה בעת יציאה מהתהליך
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);

    // הדרכה לפתרון בעיות נפוצות
    if (error.message.includes("ECONNREFUSED")) {
      console.log("💡 Make sure MongoDB is running:");
      console.log(
        "   - Install MongoDB: https://www.mongodb.com/try/download/community"
      );
      console.log("   - Start MongoDB service");
      console.log(
        "   - Or use MongoDB Atlas (cloud): https://cloud.mongodb.com"
      );
    }

    if (error.message.includes("authentication failed")) {
      console.log("💡 Check your MongoDB credentials in .env file");
    }

    process.exit(1);
  }
};

// פונקציה לבדיקת מצב החיבור
const getConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    status: states[state] || "unknown",
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    readyState: state,
  };
};

module.exports = {
  connectDB,
  getConnectionStatus,
};
