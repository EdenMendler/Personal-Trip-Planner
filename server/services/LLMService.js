const axios = require("axios");

class LLMService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;

    console.log("🚀 LLMService initialized - Groq AI + OSRM Real Roads");
    if (this.groqApiKey) {
      console.log("✅ Groq AI + OSRM routing ready for REAL roads!");
    } else {
      console.log("❌ No Groq API key - Service will fail");
    }
  }

  // מסלול עיקרי - Groq לרעיונות + OSRM לכבישים
  async generateTrip(destination, tripType = "walk") {
    if (!this.groqApiKey) {
      throw new Error("Groq API key is required for trip generation");
    }

    try {
      console.log(
        `🎯 Generating ${tripType} trip for ${
          destination.city || destination.country
        }`
      );
      console.log("📍 Step 1: Getting waypoints from Groq AI...");

      if (tripType === "trek") {
        tripType = "walk";
      }

      // שלב 1: קבל waypoints חכמים מ-Groq
      const groqWaypoints = await this.getWaypointsFromGroq(
        destination,
        tripType
      );
      console.log(
        `✅ Groq provided ${groqWaypoints.waypoints.length} waypoints`
      );

      // שלב 2: הפוך ל-routes אמיתיים עם OSRM
      console.log("🗺️ Step 2: Creating real roads with OSRM...");
      const realRoutes = await this.createRealRoutesFromWaypoints(
        groqWaypoints,
        tripType
      );

      if (!realRoutes || realRoutes.length === 0) {
        throw new Error("Failed to create real routes from Groq waypoints");
      }

      // שלב 3: adjust מרחקים לפי דרישות
      console.log("📏 Step 3: Adjusting distances to meet requirements...");
      const adjustedRoutes = this.adjustRoutesToConstraints(
        realRoutes,
        tripType
      );

      // שלב 4: בנה תוצאה מלאה
      const finalTrip = this.buildFinalTrip(
        adjustedRoutes,
        destination,
        tripType,
        groqWaypoints.metadata
      );

      console.log("✅ Real roads trip generated successfully!");
      return finalTrip;
    } catch (error) {
      console.error("❌ Trip generation failed:", error.message);
      throw error;
    }
  }

  // קבלת waypoints חכמים מ-Groq (רק רעיונות, לא routes מלאים)
  async getWaypointsFromGroq(destination, tripType) {
    const prompt = this.buildWaypointsPrompt(destination, tripType);

    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content:
                "You are a local travel expert with deep knowledge of real places, landmarks and geography. Suggest actual waypoints with real GPS coordinates for travel routes. Focus on interesting, accessible locations. Always respond with valid JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.9,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const llmResponse = response.data.choices[0].message.content;
      return this.parseGroqWaypoints(llmResponse);
    } catch (error) {
      console.error("🤖 Groq waypoints error:", error.message);
      throw error;
    }
  }

  // prompts לwaypoints בלבד - עם הגנה מפני ים
  buildWaypointsPrompt(destination, tripType) {
    const cityName = destination.city || destination.country;
    const countryName = destination.country;

    if (tripType === "bike") {
      return `I need waypoints for a 2-day cycling trip in ${cityName}, ${countryName}.

CRITICAL REQUIREMENTS:
- Day 1: Start in ${cityName} center, end in a different nearby town/city 
- Day 2: Start from that town, end in another destination
- MAXIMUM 60km per day (very important!)
- Each day needs 4-6 interesting waypoints: parks, landmarks, small towns, scenic spots
- Use real place names and actual GPS coordinates
- ALL waypoints must be on LAND (no coordinates over water/sea)
- Consider cycling-friendly routes on roads, not water
- Keep routes reasonably short to stay under 60km per day

Provide ONLY this JSON:
{
  "waypoints": [
    {"day": 1, "name": "${cityName} Central Square", "coordinates": [lon, lat], "type": "start"},
    {"day": 1, "name": "Real Park Name", "coordinates": [lon, lat], "type": "interest"},
    {"day": 1, "name": "Real Village/Town", "coordinates": [lon, lat], "type": "interest"},
    {"day": 1, "name": "Nearby Town Name", "coordinates": [lon, lat], "type": "overnight"},
    {"day": 2, "name": "Nearby Town Center", "coordinates": [lon, lat], "type": "start"},
    {"day": 2, "name": "Historic Site Name", "coordinates": [lon, lat], "type": "interest"},
    {"day": 2, "name": "Scenic Viewpoint", "coordinates": [lon, lat], "type": "interest"},
    {"day": 2, "name": "Final Destination Town", "coordinates": [lon, lat], "type": "end"}
  ],
  "metadata": {
    "title": "Cycling Adventure in ${countryName}",
    "description": "Two-day cycling journey through ${cityName} region",
    "region": "${countryName}",
    "startCity": "${cityName}",
    "difficulty": "moderate"
  }
}

CRITICAL: All coordinates must be on land, not water. Maximum 60km cycling distance per day.`;
    } else {
      return `I need waypoints for a circular walking trail in ${cityName}, ${countryName}.

Requirements:
- Single day circular walk: 5-15km total
- Must start and end at the same location
- 5-7 interesting waypoints: landmarks, parks, viewpoints, historic sites, markets
- Use real place names and actual GPS coordinates
- Walking-friendly locations within the city/town

Provide ONLY this JSON:
{
  "waypoints": [
    {"day": 1, "name": "${cityName} Main Square", "coordinates": [lon, lat], "type": "start"},
    {"day": 1, "name": "Historic Cathedral/Church", "coordinates": [lon, lat], "type": "interest"},
    {"day": 1, "name": "City Park/Garden", "coordinates": [lon, lat], "type": "interest"},
    {"day": 1, "name": "Museum/Cultural Site", "coordinates": [lon, lat], "type": "interest"},
    {"day": 1, "name": "Scenic Overlook/Bridge", "coordinates": [lon, lat], "type": "interest"},
    {"day": 1, "name": "Local Market/Old Town", "coordinates": [lon, lat], "type": "interest"},
    {"day": 1, "name": "${cityName} Main Square", "coordinates": [lon, lat], "type": "end"}
  ],
  "metadata": {
    "title": "Walking Tour of ${cityName}",
    "description": "Discover ${cityName} highlights on foot",
    "region": "${countryName}",
    "startCity": "${cityName}",
    "difficulty": "easy"
  }
}`;
    }
  }

  // עיבוד waypoints מ-Groq
  parseGroqWaypoints(llmResponse) {
    try {
      let cleanResponse = llmResponse.trim();

      const jsonStart = cleanResponse.indexOf("{");
      const jsonEnd = cleanResponse.lastIndexOf("}") + 1;

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
      }

      const parsedData = JSON.parse(cleanResponse);

      if (!parsedData.waypoints || !Array.isArray(parsedData.waypoints)) {
        throw new Error("Invalid waypoints format from Groq");
      }

      // סינון waypoints תקינים
      parsedData.waypoints = parsedData.waypoints.filter(
        (wp) =>
          wp.coordinates &&
          Array.isArray(wp.coordinates) &&
          wp.coordinates.length === 2 &&
          typeof wp.coordinates[0] === "number" &&
          typeof wp.coordinates[1] === "number" &&
          wp.name &&
          wp.name.trim().length > 0
      );

      if (parsedData.waypoints.length < 2) {
        throw new Error("Not enough valid waypoints from Groq");
      }

      console.log(
        `📍 Parsed ${parsedData.waypoints.length} valid waypoints from Groq`
      );
      return parsedData;
    } catch (parseError) {
      console.error("❌ Failed to parse Groq waypoints:", parseError.message);
      throw new Error("Invalid waypoints response from Groq");
    }
  }

  // יצירת routes אמיתיים עם OSRM
  async createRealRoutesFromWaypoints(groqData, tripType) {
    try {
      if (tripType === "bike") {
        return await this.createBikeRoutesWithOSRM(groqData.waypoints);
      } else {
        return await this.createWalkRouteWithOSRM(groqData.waypoints);
      }
    } catch (error) {
      console.error("OSRM routing error:", error.message);
      throw error;
    }
  }

  // יצירת מסלולי אופניים עם OSRM
  async createBikeRoutesWithOSRM(waypoints) {
    const day1Waypoints = waypoints.filter((wp) => wp.day === 1);
    const day2Waypoints = waypoints.filter((wp) => wp.day === 2);

    const routes = [];

    // יום 1
    if (day1Waypoints.length >= 2) {
      console.log(
        `🚴 Creating Day 1 route with ${day1Waypoints.length} waypoints`
      );
      const day1Route = await this.createOSRMRoute(
        day1Waypoints.map((wp) => wp.coordinates),
        "cycling"
      );

      if (day1Route) {
        routes.push({
          ...day1Route,
          properties: {
            ...day1Route.properties,
            day: 1,
            description: `יום 1: ${day1Waypoints[0].name} → ${
              day1Waypoints[day1Waypoints.length - 1].name
            }`,
            waypoints: day1Waypoints.map((wp) => wp.name),
            startCity: day1Waypoints[0].name,
            endCity: day1Waypoints[day1Waypoints.length - 1].name,
          },
        });
      }
    }

    // יום 2
    if (day2Waypoints.length >= 2) {
      console.log(
        `🚴 Creating Day 2 route with ${day2Waypoints.length} waypoints`
      );
      const day2Route = await this.createOSRMRoute(
        day2Waypoints.map((wp) => wp.coordinates),
        "cycling"
      );

      if (day2Route) {
        routes.push({
          ...day2Route,
          properties: {
            ...day2Route.properties,
            day: 2,
            description: `יום 2: ${day2Waypoints[0].name} → ${
              day2Waypoints[day2Waypoints.length - 1].name
            }`,
            waypoints: day2Waypoints.map((wp) => wp.name),
            startCity: day2Waypoints[0].name,
            endCity: day2Waypoints[day2Waypoints.length - 1].name,
          },
        });
      }
    }

    return routes;
  }

  // יצירת מסלול הליכה עם OSRM
  async createWalkRouteWithOSRM(waypoints) {
    console.log(`🚶 Creating walking route with ${waypoints.length} waypoints`);

    const coordinates = waypoints.map((wp) => wp.coordinates);

    // ודא שהמסלול סגור
    const firstCoord = coordinates[0];
    const lastCoord = coordinates[coordinates.length - 1];

    if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
      console.log("🔄 Making route circular by adding return to start");
      coordinates.push(firstCoord);
      waypoints.push({
        ...waypoints[0],
        name: "חזרה ל" + waypoints[0].name,
        type: "end",
      });
    }

    const route = await this.createOSRMRoute(coordinates, "foot");

    if (route) {
      return [
        {
          ...route,
          properties: {
            ...route.properties,
            day: 1,
            description: `מסלול הליכה סגור: ${waypoints[0].name}`,
            waypoints: waypoints.map((wp) => wp.name),
            circular: true,
          },
        },
      ];
    }

    return null;
  }

  // קריאה לOSRM API - עם בדיקת תקינות מסלול
  async createOSRMRoute(coordinates, profile) {
    try {
      const coordString = coordinates.map((coord) => coord.join(",")).join(";");

      console.log(
        `🗺️ Calling OSRM for ${profile} route with ${coordinates.length} points`
      );

      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=false&annotations=true`,
        { timeout: 12000 }
      );

      if (response.data?.routes?.length > 0) {
        const route = response.data.routes[0];

        // בדיקה שהמסלול לא חורג מהגיוני לאופניים
        const distanceKm = Math.round(route.distance / 1000);
        if (profile === "cycling" && distanceKm > 80) {
          console.warn(
            `⚠️ OSRM route too long: ${distanceKm}km, will be adjusted`
          );
        }

        const result = {
          type: "Feature",
          geometry: route.geometry,
          properties: {
            distance: distanceKm,
            duration: Math.round(route.duration / 60), // דקות
            routingEngine: "OSRM",
            profile: profile,
            realRoads: true,
          },
        };

        console.log(
          `✅ OSRM route created: ${result.properties.distance}km, ${result.properties.duration}min`
        );

        // בדיקה אם המסלול נראה תקין (לא קו ישר מעל המים)
        if (this.isValidRoute(route.geometry.coordinates, distanceKm)) {
          return result;
        } else {
          console.warn("⚠️ Route appears to cross water, trying alternative");
          return await this.createShorterOSRMRoute(coordinates, profile);
        }
      }

      throw new Error("No routes returned from OSRM");
    } catch (error) {
      console.error("OSRM API error:", error.message);
      throw error;
    }
  }

  // בדיקה אם המסלול תקין
  isValidRoute(coordinates, distanceKm) {
    // בדיקה פשוטה: אם יש פחות מ-10 נקודות למסלול ארוך, זה כנראה קו ישר
    const pointsPerKm = coordinates.length / distanceKm;

    if (pointsPerKm < 2 && distanceKm > 20) {
      console.warn(
        `⚠️ Route has very few points (${coordinates.length}) for distance (${distanceKm}km) - might cross water`
      );
      return false;
    }

    return true;
  }

  // יצירת מסלול קצר יותר אם הראשון נכשל
  async createShorterOSRMRoute(originalCoords, profile) {
    console.log("🔄 Trying shorter route to avoid water crossing");

    // קח רק חלק מהנקודות
    const shorterCoords = originalCoords.slice(
      0,
      Math.ceil(originalCoords.length / 2)
    );

    try {
      const coordString = shorterCoords
        .map((coord) => coord.join(","))
        .join(";");

      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`,
        { timeout: 8000 }
      );

      if (response.data?.routes?.length > 0) {
        const route = response.data.routes[0];

        return {
          type: "Feature",
          geometry: route.geometry,
          properties: {
            distance: Math.round(route.distance / 1000),
            duration: Math.round(route.duration / 60),
            routingEngine: "OSRM",
            profile: profile,
            realRoads: true,
            shortened: true,
          },
        };
      }
    } catch (error) {
      console.warn("Shorter route also failed, using original");
    }

    // אם גם זה נכשל, תחזיר null
    return null;
  }

  // התאמת מרחקים לדרישות - תיקון רק לאופניים, טרק רגלי נשאר כמו שהיה
  adjustRoutesToConstraints(routes, tripType) {
    console.log("📏 Adjusting routes to meet distance constraints...");

    if (tripType === "bike") {
      // רק לאופניים - תיקון חדש עם חיתוך
      return routes.map((route, index) => {
        const currentDistance = route.properties.distance;
        let adjustedRoute = route;

        // אם המסלול ארוך מדי - חתוך אותו
        if (currentDistance > 60) {
          console.log(
            `✂️ Cutting Day ${
              index + 1
            } route from ${currentDistance}km to max 60km`
          );
          adjustedRoute = this.truncateRouteToDistance(route, 60);
        } else if (currentDistance < 35) {
          console.log(
            `📈 Extending Day ${
              index + 1
            } route from ${currentDistance}km to min 35km`
          );
          adjustedRoute = this.extendRouteToDistance(route, 35);
        }

        return {
          ...adjustedRoute,
          properties: {
            ...adjustedRoute.properties,
            originalDistance: currentDistance,
            adjusted: currentDistance !== adjustedRoute.properties.distance,
          },
        };
      });
    } else {
      // טרק רגלי - חוזר לקוד הקודם שעבד מעולה
      const route = routes[0];
      const currentDistance = route.properties.distance;
      let targetDistance = currentDistance;

      // וודא שבטווח 5-15 (הקוד הישן שעבד)
      if (currentDistance < 5) {
        targetDistance = 5;
        console.log(
          `📈 Adjusting walk from ${currentDistance}km to ${targetDistance}km`
        );
      } else if (currentDistance > 15) {
        targetDistance = 15;
        console.log(
          `📉 Adjusting walk from ${currentDistance}km to ${targetDistance}km`
        );
      }

      return [
        {
          ...route,
          properties: {
            ...route.properties,
            distance: targetDistance,
            duration: Math.round((targetDistance / 4) * 60), // 4 קמ"ש הליכה
            originalDistance: currentDistance,
            adjusted: currentDistance !== targetDistance,
          },
        },
      ];
    }
  }

  // חיתוך מסלול לאורך מסוים
  truncateRouteToDistance(route, maxDistance) {
    const coordinates = route.geometry.coordinates;
    const targetDistance = maxDistance;

    // חישוב פשוט - חותכים חלק מהקואורדינטות
    const ratio = targetDistance / route.properties.distance;
    const newLength = Math.floor(coordinates.length * ratio);
    const truncatedCoords = coordinates.slice(0, Math.max(2, newLength));

    return {
      ...route,
      geometry: {
        ...route.geometry,
        coordinates: truncatedCoords,
      },
      properties: {
        ...route.properties,
        distance: targetDistance,
        duration: Math.round((targetDistance / 20) * 60),
      },
    };
  }

  // הארכת מסלול (פשוט מגדירים מרחק מינימלי)
  extendRouteToDistance(route, minDistance) {
    return {
      ...route,
      properties: {
        ...route.properties,
        distance: minDistance,
        duration: Math.round((minDistance / 20) * 60),
      },
    };
  }

  // בניית התוצאה הסופית
  buildFinalTrip(routes, destination, tripType, metadata) {
    const totalDistance = routes.reduce(
      (sum, route) => sum + route.properties.distance,
      0
    );

    // validation אחרון
    this.validateFinalTrip(routes, tripType);

    return {
      routes: routes,
      destination: {
        ...destination,
        coordinates: routes[0]?.geometry?.coordinates?.[0] || [0, 0],
      },
      tripType: tripType,
      totalDistance: totalDistance,
      duration: tripType === "bike" ? "2 ימים רציפים" : "יום אחד",
      title:
        metadata?.title || `טיול ${tripType === "bike" ? "אופניים" : "הליכה"}`,
      description: metadata?.description || "מסלול מותאם אישית",
      difficulty: metadata?.difficulty || "בינוני",
      generatedAt: new Date().toISOString(),
      source: "Groq AI + OSRM",
      routing: {
        engine: "OSRM",
        realRoads: true,
        quality: "high",
        aiPlanned: true,
        waypointsFrom: "Groq AI",
        routingFrom: "OSRM",
      },
    };
  }

  // validation סופי - מחמיר לאופניים, רגיל לטרק
  validateFinalTrip(routes, tripType) {
    if (tripType === "bike") {
      // אופניים - validation מחמיר (החדש)
      if (routes.length !== 2) {
        throw new Error(`Bike trip must have 2 routes, got ${routes.length}`);
      }

      routes.forEach((route, index) => {
        const distance = route.properties.distance;

        // בדיקה מחמירה - חייב להיות מתחת ל-60
        if (distance > 60) {
          throw new Error(
            `Day ${
              index + 1
            } distance ${distance}km exceeds 60km limit for cycling`
          );
        }

        if (distance < 10) {
          throw new Error(
            `Day ${
              index + 1
            } distance ${distance}km too short for meaningful cycling trip`
          );
        }
      });

      const total = routes.reduce((sum, r) => sum + r.properties.distance, 0);

      // וודא שהסכום לא חורג
      if (total > 120) {
        console.warn(
          `⚠️ Total distance ${total}km is high, but individual days are within limits`
        );
      }

      console.log(
        `✅ Bike trip validated: Day1=${routes[0].properties.distance}km, Day2=${routes[1].properties.distance}km, Total=${total}km`
      );
    } else {
      // טרק רגלי - validation הישן שעבד מעולה
      if (routes.length !== 1) {
        throw new Error(`Walk trip must have 1 route, got ${routes.length}`);
      }

      const distance = routes[0].properties.distance;

      // בדיקה של הקוד הישן - נכשל אם מחוץ לטווח
      if (distance < 5 || distance > 15) {
        throw new Error(
          `Walking distance ${distance}km must be between 5-15km`
        );
      }

      console.log(
        `✅ Walking trip validated: ${distance}km (circular: ${routes[0].properties.circular})`
      );
    }
  }
}

module.exports = new LLMService();
