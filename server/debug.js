// debug.js - קובץ עזר לבדיקת חיבור ומשתמשים
const mongoose = require("mongoose");
const User = require("./models/User"); // התאם את הנתיב לפי המבנה שלך

// פונקציה לבדיקת חיבור למסד הנתונים
async function checkDatabaseConnection() {
  try {
    console.log("🔍 Checking database connection...");
    console.log("Connection state:", mongoose.connection.readyState);
    console.log("Database name:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

    if (mongoose.connection.readyState === 1) {
      console.log("✅ Database is connected");
      return true;
    } else {
      console.log("❌ Database is not connected");
      return false;
    }
  } catch (error) {
    console.error("❌ Database connection error:", error);
    return false;
  }
}

// פונקציה לבדיקת משתמשים במסד הנתונים
async function checkUsers() {
  try {
    console.log("\n🔍 Checking users in database...");

    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);

    if (userCount > 0) {
      const users = await User.find(
        {},
        { email: 1, name: 1, createdAt: 1 }
      ).limit(5);
      console.log("Sample users:");
      users.forEach((user, index) => {
        console.log(
          `  ${index + 1}. ${user.email} (${user.name}) - Created: ${
            user.createdAt
          }`
        );
      });
    } else {
      console.log("No users found in database");
    }

    return userCount;
  } catch (error) {
    console.error("❌ Error checking users:", error);
    return 0;
  }
}

// פונקציה לבדיקת משתמש ספציפי
async function checkSpecificUser(email) {
  try {
    console.log(`\n🔍 Checking specific user: ${email}`);

    const user = await User.findByEmail(email);
    if (user) {
      console.log("✅ User found:");
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Last login: ${user.lastLogin}`);
      return user;
    } else {
      console.log("❌ User not found");
      return null;
    }
  } catch (error) {
    console.error("❌ Error checking user:", error);
    return null;
  }
}

// פונקציה ליצירת משתמש לדוגמה (למטרות בדיקה בלבד)
async function createTestUser() {
  try {
    console.log("\n🧪 Creating test user...");

    const testEmail = "test@example.com";

    // בדיקה אם המשתמש כבר קיים
    const existingUser = await User.findByEmail(testEmail);
    if (existingUser) {
      console.log("Test user already exists");
      return existingUser;
    }

    const testUser = new User({
      name: "Test User",
      email: testEmail,
      password: "test123456",
    });

    await testUser.save();
    console.log("✅ Test user created successfully");
    return testUser;
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    return null;
  }
}

// פונקציה לבדיקת סיסמה
async function testPasswordCheck(email, password) {
  try {
    console.log(`\n🔐 Testing password for: ${email}`);

    const user = await User.findByEmail(email);
    if (!user) {
      console.log("❌ User not found");
      return false;
    }

    const isValid = await user.comparePassword(password);
    console.log(`Password valid: ${isValid ? "✅ Yes" : "❌ No"}`);
    return isValid;
  } catch (error) {
    console.error("❌ Error testing password:", error);
    return false;
  }
}

// פונקציה ראשית לביצוע כל הבדיקות
async function runAllChecks() {
  console.log("🚀 Starting database and user checks...\n");

  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.log("❌ Cannot proceed - database not connected");
    return;
  }

  const userCount = await checkUsers();

  // יצירת משתמש לדוגמה אם אין משתמשים
  if (userCount === 0) {
    await createTestUser();
    await checkUsers();
  }

  // בדיקת משתמש ספציפי אם קיימים משתמשים
  if (userCount > 0) {
    await checkSpecificUser("test@example.com");
    await testPasswordCheck("test@example.com", "test123456");
  }

  console.log("\n✅ All checks completed!");
}

module.exports = {
  checkDatabaseConnection,
  checkUsers,
  checkSpecificUser,
  createTestUser,
  testPasswordCheck,
  runAllChecks,
};

// אם הקובץ מופעל ישירות
if (require.main === module) {
  // השתמש בזה אם אתה רוצה להפעיל את הבדיקות ישירות
  console.log("This is a debug helper module");
  console.log("Use: require('./debug').runAllChecks() in your server file");
}
