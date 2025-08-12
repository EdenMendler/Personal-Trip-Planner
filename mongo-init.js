// קובץ הגדרה ראשונית לMongoDB
// הקובץ הזה ירוץ בעת יצירת המסד לראשונה

// יצירת מסד נתונים ומשתמש
db = db.getSiblingDB("travel-planner");

// יצירת משתמש למסד הנתונים
db.createUser({
  user: "travelapp",
  pwd: "travelapp123",
  roles: [
    {
      role: "readWrite",
      db: "travel-planner",
    },
  ],
});

// יצירת קולקציות בסיסיות
db.createCollection("users");
db.createCollection("trips");

// הוספת אינדקסים לביצועים
db.users.createIndex({ email: 1 }, { unique: true });
db.trips.createIndex({ userId: 1 });
db.trips.createIndex({ createdAt: -1 });

// הוספת נתונים לדוגמה (אופציונלי)
print("MongoDB initialized successfully for Travel Planner app");
print("Database: travel-planner");
print("Collections: users, trips");
print("Indexes created for email and userId");
