import React from "react";
import "./Common.css";

const Loading = ({ message = "טוען...", size = "large" }) => {
  return (
    <div className={`loading-container ${size}`}>
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export const LoadingSpinner = ({ size = "small" }) => {
  return (
    <div className={`inline-loading ${size}`}>
      <div className="spinner-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );
};

export const LoadingWithText = ({
  message = "טוען...",
  description = null,
  icon = "🔄",
}) => {
  return (
    <div className="loading-with-text">
      <div className="loading-icon">{icon}</div>
      <h3 className="loading-title">{message}</h3>
      {description && <p className="loading-description">{description}</p>}
      <div className="loading-progress">
        <div className="progress-bar"></div>
      </div>
    </div>
  );
};

export const MapLoading = () => {
  return (
    <div className="map-loading">
      <div className="map-loading-content">
        <div className="map-icon">🗺️</div>
        <h3>טוען מפה...</h3>
        <p>אנא המתינו בזמן שהמפה נטענת</p>
        <div className="map-loading-animation">
          <div className="loading-wave">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
