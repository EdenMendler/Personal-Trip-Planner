# Travel Planner 🌍✈️

An advanced travel planning system with interactive user interface and dynamic maps. The system enables creating customized travel routes, viewing weather information, and complete data management.

## 🏗️ Project Structure

```
FINALPROJECT/
├── 📁 server/                    # Node.js + Express Server
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── models/
│   │   ├── Trip.js              # Trip model
│   │   └── User.js              # User model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── images.js            # Image routes
│   │   ├── trips.js             # Trip routes
│   │   └── weather.js           # Weather routes
│   ├── services/
│   │   ├── ImageService.js      # Image service
│   │   ├── LLMService.js        # AI service
│   │   └── WeatherService.js    # Weather service
│   ├── .env                     # Environment variables
│   ├── debug.js                 # Debug tools
│   ├── package.json             # Server dependencies
│   ├── package-lock.json        # Exact versions
│   └── server.js                # Main entry file
│
├── 📁 client/                    # React Application
│   ├── public/
│   │   └── index.html           # Main HTML file
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── AuthForm.css
│   │   │   │   ├── Login.js
│   │   │   │   └── Register.js
│   │   │   ├── Common/
│   │   │   │   ├── Common.css
│   │   │   │   ├── Header.js
│   │   │   │   └── Loading.js
│   │   │   ├── MyTrips/
│   │   │   │   ├── MyTrips.css
│   │   │   │   └── MyTrips.js
│   │   │   └── TripPlanner/
│   │   │       ├── index.js
│   │   │       ├── TripForm.js
│   │   │       ├── TripMap.js
│   │   │       ├── TripPlanner.css
│   │   │       ├── TripPlanner.js
│   │   │       ├── TripSummary.css
│   │   │       ├── TripSummary.js
│   │   │       └── WeatherDisplay.js
│   │   ├── services/
│   │   │   ├── api.js           # API services
│   │   │   └── auth.js          # Auth services
│   │   ├── App.css              # General styles
│   │   ├── App.js               # Main component
│   │   ├── index.css            # Basic styles
│   │   └── index.js             # Entry point
│   ├── package.json             # Client dependencies
│   └── package-lock.json        # Exact versions
│
├── docker-compose.yml           # Docker configuration
├── mongo-init.js                # MongoDB initialization
└── README.md                    # This guide
```

## 🚀 Technologies Used

### Backend (Server)
- **Node.js** - Fast and efficient runtime environment
- **Express.js** - Minimalistic framework for building REST API
- **MongoDB** - Flexible and fast NoSQL database
- **Mongoose** - Advanced ODM for MongoDB with validation
- **Express-session** - Secure session management with MongoDB store
- **Bcrypt** - Strong password encryption
- **Axios** - HTTP requests to external services
- **CORS** - Secure support for cross-origin requests
- **Express-validator** - Advanced validation for incoming data

### Frontend (Client)
- **React 18** - Advanced UI library
- **React Router DOM** - Navigation between pages and SPA routing
- **React Leaflet** - Interactive React-based maps
- **Leaflet** - Powerful and flexible map library
- **Axios** - Advanced HTTP requests to server
- **CSS Modules** - Component-based style management

### Database & Infrastructure
- **MongoDB 7.0** - Main database
- **MongoDB Express** - Database management interface
- **Docker & Docker Compose** - Environment management

## 🎯 System Features

### ✨ Main Features

- 🗺️ **Interactive Route Planning** - Creating customized travel routes with dynamic maps using React Leaflet. The system allows entering a country and city to travel in and choosing between walking route or cycling route and will create the route.

- 🌤️ **Real-time Weather Information** - Getting updated and accurate weather forecast for every destination in the trip using OpenWeatherMap API. The system displays current temperature, 3-day forecast.

- 📸 **Destination Image Gallery** - Automatic display of high-quality and relevant images for every destination in the trip using Unsplash API.

- 🤖 **Smart AI Consultation** - Advanced service based on GROQ API that provides customized recommendations for travel routes.

- 👤 **User Management** - Registration, login and profile management with full security.

- 💾 **Personal Trip Archive** - Complete saving and management of all planned trips in MongoDB database. Users can save planned trips.

- 🚶‍♂️🚴‍♀️ **Activity-Type Adapted Routes** - 
  - **For Cycling**: Two consecutive days route (city to city) on map, information about each route length, maximum cycling route is 60 km per day, including information about each route length per day.
  - **For Walking Trek**: Route between 5-15 km per day, routes that start at the starting point and end there. Information about each route length per day.

## 🔧 Environment Setup

### System Requirements
- **Node.js** version 14 and above
- **Docker & Docker Compose**
- **VS Code** (recommended)

### Environment Variables (.env)
Create a `.env` file in the server folder with the following settings:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/travel-planner

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# API Keys (optional - system works with free APIs)
OPENWEATHER_API_KEY=your-weather-api-key
UNSPLASH_ACCESS_KEY=your-unsplash-api-key
GROQ_API_KEY=your-groq-api-key
```

## 🚀 Running the Project in VS Code

### Step 1: Opening the Project
1. Open VS Code
2. Open the main project folder
3. Open 3 new terminals: `Terminal → New Terminal` (repeat 3 times)

### Step 2: Running Docker (Terminal #1)
```bash
# In the first terminal - run the database
docker-compose up -d
```

**Command explanation:**
- `docker-compose up` - runs the services defined in docker-compose.yml
- `-d` - runs in background (detached mode)

### Step 3: Running the Server (Terminal #2)
```bash
# Navigate to server folder
cd server

# Install dependencies (only first time)
npm install

# Run server in development mode
npm run dev
```

**Server will run on:** http://localhost:5000

### Step 4: Running the Client (Terminal #3)
```bash
# Navigate to client folder
cd client

# Install dependencies (only first time)
npm install

# Run React application
npm start
```

**Application will open automatically on:** http://localhost:3000

## 🔐 Security

### Server Security Settings
- **Password encryption** with bcrypt
- **Secure sessions** with express-session
- **CORS configured** for port 3000 only
- **Validation** of incoming data
- **httpOnly cookies** to prevent XSS

---

The system is ready for development and use. All services should work smoothly with the 3 terminals you set up.

**Remember:** Docker → Server → Client - in that order! 🚀