const axios = require("axios");

class ImageService {
  constructor() {
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

    console.log("🖼️ Image Service initialized");
    if (this.unsplashAccessKey) {
      console.log("✅ Unsplash API ready - High quality photos!");
    } else {
      console.log(
        "ℹ️ No Unsplash API key found. Using curated placeholder images."
      );
    }
  }

  // קבלת תמונה מייצגת ליעד
  async getDestinationImage(country, city = null) {
    try {
      if (this.unsplashAccessKey) {
        console.log(`🔍 Searching Unsplash for: ${city || country}`);
        const image = await this.getUnsplashImage(country, city);
        if (image) {
          console.log(`✅ Found Unsplash photo by ${image.user.name}`);
          return this.formatUnsplashResponse(image);
        }
      }

      // תמונות placeholder איכותיות מUnsplash (ללא API)
      console.log(`📷 Using curated placeholder for ${country}`);
      return this.getCuratedPlaceholderImage(country, city);
    } catch (error) {
      console.log(`⚠️ Unsplash error, using placeholder for ${country}`);
      return this.getCuratedPlaceholderImage(country, city);
    }
  }

  // קבלת תמונה מ-Unsplash
  async getUnsplashImage(country, city = null) {
    if (!this.unsplashAccessKey) return null;

    try {
      const searchQuery = this.buildSearchQuery(country, city);

      const response = await axios.get(
        "https://api.unsplash.com/search/photos",
        {
          params: {
            query: searchQuery,
            orientation: "landscape",
            per_page: 30,
            order_by: "relevant",
            content_filter: "high",
          },
          headers: {
            Authorization: `Client-ID ${this.unsplashAccessKey}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        // בחירת תמונה איכותית (עם likes גבוהים)
        const sortedImages = response.data.results.sort(
          (a, b) => b.likes - a.likes
        );
        const selectedImage =
          sortedImages[
            Math.floor(Math.random() * Math.min(5, sortedImages.length))
          ];

        // טריגור מעקב הורדה לUnsplash
        this.triggerDownload(selectedImage.links.download_location);

        return selectedImage;
      }

      return null;
    } catch (error) {
      if (error.response?.status === 401) {
        console.error("❌ Unsplash API key is invalid");
      } else if (error.response?.status === 403) {
        console.error("❌ Unsplash rate limit exceeded");
      } else {
        console.log(`⚠️ Unsplash API error: ${error.message}`);
      }
      return null;
    }
  }

  // בניית מילות חיפוש חכמות
  buildSearchQuery(country, city = null) {
    // מילים נוספות לתמונות יפות יותר
    const travelKeywords = [
      "landscape",
      "travel",
      "architecture",
      "nature",
      "scenic",
      "beautiful",
      "landmark",
      "tourism",
      "destination",
      "culture",
    ];

    // תרגום שמות מדינות לאנגלית
    const countryTranslations = {
      ישראל: "israel jerusalem",
      צרפת: "france paris",
      איטליה: "italy rome",
      ספרד: "spain barcelona",
      יוון: "greece santorini",
      פורטוגל: "portugal lisbon",
      קרואטיה: "croatia dubrovnik",
      שוויץ: "switzerland alps",
      אוסטריה: "austria vienna",
      הולנד: "netherlands amsterdam",
      גרמניה: "germany berlin",
      בלגיה: "belgium brussels",
      דנמרק: "denmark copenhagen",
      נורווגיה: "norway fjords",
      שוודיה: "sweden stockholm",
      פינלנד: "finland helsinki",
      "צ'כיה": "czech republic prague",
      הונגריה: "hungary budapest",
      פולין: "poland krakow",
      רומניה: "romania bucharest",
    };

    // תרגום שמות ערים לאנגלית
    const cityTranslations = {
      ירושלים: "jerusalem",
      "תל אביב": "tel aviv",
      חיפה: "haifa",
      פריז: "paris",
      רומא: "rome",
      ברצלונה: "barcelona",
      מדריד: "madrid",
      אתונה: "athens",
      ליסבון: "lisbon",
      אמסטרדם: "amsterdam",
      ברלין: "berlin",
      וינה: "vienna",
      קופנהגן: "copenhagen",
      סטוקהולם: "stockholm",
      פראג: "prague",
      בודפשט: "budapest",
    };

    // תרגום המדינה והעיר
    const englishCountry =
      countryTranslations[country] || country.toLowerCase();
    const englishCity = cityTranslations[city] || city;

    // בניית החיפוש החכם
    let searchTerms = [];

    if (city && englishCity && englishCity !== city.toLowerCase()) {
      searchTerms.push(englishCity);
    } else if (city) {
      searchTerms.push(city.toLowerCase());
    }

    // הוספת המדינה (או העיר הראשית שלה)
    searchTerms.push(englishCountry);

    // הוספת מילת מפתח אקראית לתמונות יפות יותר
    const randomKeyword =
      travelKeywords[Math.floor(Math.random() * travelKeywords.length)];
    searchTerms.push(randomKeyword);

    const query = searchTerms.join(" ");
    console.log(`🔍 Unsplash search query: "${query}"`);
    return query;
  }

  // עיצוב תגובת Unsplash
  formatUnsplashResponse(image) {
    return {
      url: image.urls.regular,
      thumbnailUrl: image.urls.small,
      previewUrl: image.urls.thumb,
      alt:
        image.alt_description ||
        image.description ||
        "Beautiful travel destination",
      width: image.width,
      height: image.height,
      credit: {
        photographer: image.user.name,
        photographerUrl: image.user.links.html,
        photographerUsername: image.user.username,
        source: "Unsplash",
        sourceUrl: "https://unsplash.com/",
        imageUrl: image.links.html,
        license: "Free for commercial use",
      },
      tags: image.tags?.map((tag) => tag.title) || [],
      stats: {
        likes: image.likes,
        downloads: image.downloads,
      },
      downloadLocation: image.links.download_location,
    };
  }

  // תמונות placeholder מובחרות מUnsplash (ללא API)
  getCuratedPlaceholderImage(country, city = null) {
    const curatedImages = {
      // ישראל
      israel: {
        url: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "Jerusalem Old City, Israel",
        photographer: "Stacey Franco",
        username: "staceyfranco",
      },
      ישראל: {
        url: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "ירושלים העתיקה, ישראל",
        photographer: "Stacey Franco",
        username: "staceyfranco",
      },

      // צרפת
      france: {
        url: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "Eiffel Tower, Paris, France",
        photographer: "Anthony Delanoix",
        username: "anthonydelanoix",
      },
      צרפת: {
        url: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "מגדל אייפל, פריז, צרפת",
        photographer: "Anthony Delanoix",
        username: "anthonydelanoix",
      },

      // איטליה
      italy: {
        url: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "Venice Canals, Italy",
        photographer: "Henrique Ferreira",
        username: "henriqueferreira",
      },
      איטליה: {
        url: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "תעלות ונציה, איטליה",
        photographer: "Henrique Ferreira",
        username: "henriqueferreira",
      },

      // ספרד
      spain: {
        url: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "Sagrada Familia, Barcelona, Spain",
        photographer: "Toa Heftiba",
        username: "heftiba",
      },
      ספרד: {
        url: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "סגרדה פמיליה, ברצלונה, ספרד",
        photographer: "Toa Heftiba",
        username: "heftiba",
      },

      // יוון
      greece: {
        url: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "Santorini Island, Greece",
        photographer: "Jimmy Teoh",
        username: "jimmyteoh",
      },
      יוון: {
        url: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "האי סנטוריני, יוון",
        photographer: "Jimmy Teoh",
        username: "jimmyteoh",
      },

      // גרמניה
      germany: {
        url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "Brandenburg Gate, Berlin, Germany",
        photographer: "Aniket Deole",
        username: "aniket940518",
      },
      גרמניה: {
        url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "שער ברנדנבורג, ברלין, גרמניה",
        photographer: "Aniket Deole",
        username: "aniket940518",
      },

      // ברירת מחדל
      default: {
        url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&w=1200&h=800&fit=crop&q=80",
        alt: "Beautiful mountain landscape",
        photographer: "Ishan @seefromthesky",
        username: "seefromthesky",
      },
    };

    const selectedImage =
      curatedImages[country.toLowerCase()] ||
      curatedImages[country] ||
      curatedImages.default;

    return {
      url: selectedImage.url,
      thumbnailUrl: selectedImage.url.replace("w=1200&h=800", "w=400&h=300"),
      previewUrl: selectedImage.url.replace("w=1200&h=800", "w=200&h=150"),
      alt: selectedImage.alt,
      width: 1200,
      height: 800,
      credit: {
        photographer: selectedImage.photographer,
        photographerUsername: selectedImage.username,
        source: "Unsplash",
        sourceUrl: "https://unsplash.com/",
        imageUrl: `https://unsplash.com/@${selectedImage.username}`,
        license: "Free for commercial use",
      },
      tags: [country, city, "travel", "destination", "placeholder"].filter(
        Boolean
      ),
      isPlaceholder: true,
      stats: {
        likes: "High quality",
        downloads: "Curated selection",
      },
    };
  }

  // טריגור הורדה לסטטיסטיקות Unsplash
  async triggerDownload(downloadLocation) {
    if (!this.unsplashAccessKey || !downloadLocation) return;

    try {
      await axios.get(downloadLocation, {
        headers: {
          Authorization: `Client-ID ${this.unsplashAccessKey}`,
        },
        timeout: 5000,
      });
      console.log("📊 Unsplash download tracked successfully");
    } catch (error) {
      console.log("⚠️ Could not track Unsplash download (non-critical)");
    }
  }

  // בדיקת חיבור ל-Unsplash
  async testConnection() {
    if (!this.unsplashAccessKey) {
      return {
        connected: false,
        message: "No Unsplash API key configured",
        using: "Curated placeholder images",
      };
    }

    try {
      const response = await axios.get(
        "https://api.unsplash.com/photos/random",
        {
          params: { count: 1 },
          headers: {
            Authorization: `Client-ID ${this.unsplashAccessKey}`,
          },
          timeout: 5000,
        }
      );

      return {
        connected: true,
        message: "Connected to Unsplash API",
        rateLimit: {
          remaining: response.headers["x-ratelimit-remaining"],
          limit: response.headers["x-ratelimit-limit"],
        },
        using: "Live Unsplash API",
      };
    } catch (error) {
      return {
        connected: false,
        message:
          error.response?.status === 401 ? "Invalid API key" : error.message,
        using: "Curated placeholder images",
      };
    }
  }

  // קבלת סטטוס השירות
  getStatus() {
    return {
      available: true,
      provider: "unsplash-only",
      hasApiKey: !!this.unsplashAccessKey,
      fallback: "curated-placeholders",
      supportedCountries: [
        "israel",
        "ישראל",
        "france",
        "צרפת",
        "italy",
        "איטליה",
        "spain",
        "ספרד",
        "greece",
        "יוון",
        "germany",
        "גרמניה",
        "portugal",
        "פורטוגל",
        "austria",
        "אוסטריה",
        "netherlands",
        "הולנד",
        "switzerland",
        "שוויץ",
      ],
    };
  }

  // ניקוי מטמון (לעתיד)
  clearCache() {
    console.log("🧹 Image cache cleared (placeholder method)");
    return { success: true, message: "Cache cleared successfully" };
  }
}

module.exports = new ImageService();
