import React, { useState } from "react";

const TripForm = ({ onGenerate, loading }) => {
  const [formData, setFormData] = useState({
    destination: {
      country: "",
      city: "",
    },
    tripType: "bike",
  });
  const [errors, setErrors] = useState({});

  // עדכון שדות הטופס
  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // איפוס שגיאות
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // בדיקת תקינות הטופס
  const validateForm = () => {
    const newErrors = {};

    if (!formData.destination.country.trim()) {
      newErrors["destination.country"] = "יש להזין שם מדינה";
    }

    if (!formData.destination.city.trim()) {
      newErrors["destination.city"] = "יש להזין שם עיר";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // שליחת הטופס
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Sending trip data:", formData); // Debug
      onGenerate(formData);
    }
  };

  return (
    <div className="trip-form-container">
      <div className="trip-form-card">
        <form onSubmit={handleSubmit} className="trip-form">
          <div className="form-section">
            <h3>📍 יעד הטיול</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country">מדינה:</label>
                <input
                  type="text"
                  id="country"
                  value={formData.destination.country}
                  onChange={(e) =>
                    handleInputChange("destination.country", e.target.value)
                  }
                  placeholder="לדוגמה: ישראל, צרפת, איטליה..."
                  className={errors["destination.country"] ? "error" : ""}
                  disabled={loading}
                />
                {errors["destination.country"] && (
                  <span className="error-text">
                    {errors["destination.country"]}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="city">עיר:</label>
                <input
                  type="text"
                  id="city"
                  value={formData.destination.city}
                  onChange={(e) =>
                    handleInputChange("destination.city", e.target.value)
                  }
                  placeholder="לדוגמה: ירושלים, פריז, רומא..."
                  className={errors["destination.city"] ? "error" : ""}
                  disabled={loading}
                />
                {errors["destination.city"] && (
                  <span className="error-text">
                    {errors["destination.city"]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>🚴‍♂️ סוג הטיול</h3>

            <div className="trip-type-options">
              <label
                className={`trip-type-option ${
                  formData.tripType === "bike" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="tripType"
                  value="bike"
                  checked={formData.tripType === "bike"}
                  onChange={(e) =>
                    handleInputChange("tripType", e.target.value)
                  }
                  disabled={loading}
                />
                <div className="trip-type-content">
                  <div className="trip-type-icon">🚴‍♂️</div>
                  <div className="trip-type-details">
                    <h4>רכיבה על אופניים</h4>
                    <p>מסלול של שני ימים רציפים</p>
                    <p>עד 60 ק"מ ליום</p>
                    <p>מעיר לעיר על מסלולים ריאליים</p>
                  </div>
                </div>
              </label>

              <label
                className={`trip-type-option ${
                  formData.tripType === "trek" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="tripType"
                  value="trek"
                  checked={formData.tripType === "trek"}
                  onChange={(e) =>
                    handleInputChange("tripType", e.target.value)
                  }
                  disabled={loading}
                />
                <div className="trip-type-content">
                  <div className="trip-type-icon">🥾</div>
                  <div className="trip-type-details">
                    <h4>טרק רגלי</h4>
                    <p>מסלול מעגלי יום אחד</p>
                    <p>בין 5-15 ק"מ</p>
                    <p>התחלה וסיום באותה נקודה</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  יוצר מסלול...
                </>
              ) : (
                <>🗺️ צרו מסלול טיול</>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="trip-form-info">
        <div className="info-section">
          <h4>💡 מה תקבלו?</h4>
          <ul>
            <li>מסלול מותאם אישית על מפה אינטראקטיבית</li>
            <li>נקודות עניין לאורך המסלול</li>
            <li>תחזית מזג אוויר לשלושה ימים הקרובים</li>
            <li>תמונה מייצגת של היעד</li>
            <li>אפשרות לשמירה וחזרה למסלול</li>
          </ul>
        </div>

        <div className="info-section">
          <h4>🌍 מדינות נתמכות</h4>
          <p>
            המערכת תומכת בכל מדינה בעולם! פשוט הזינו את שם המדינה והעיר בה תרצו
            לטייל.
          </p>
          <p>
            <strong>דוגמאות:</strong> ישראל, צרפת, איטליה, ספרד, יוון, פורטוגל,
            קרואטיה, שוויץ, אוסטריה, הולנד
          </p>
        </div>

        <div className="info-section">
          <h4>🌤️ תחזית מזג אוויר</h4>
          <p>
            המערכת תציג תחזית מזג אוויר מדויקת לשלושה ימים הקרובים, בהנחה
            שהמסלול מתחיל למחרת יום הצפיה.
          </p>
        </div>

        <div className="info-section">
          <h4>📱 מפות אינטראקטיביות</h4>
          <p>
            המסלולים מוצגים על מפות אינטראקטיביות המבוססות על Leaflet עם מסלולים
            ריאליים על שבילים וכבישים.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TripForm;
