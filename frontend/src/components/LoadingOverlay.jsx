import React from "react";

export default function LoadingOverlay({ show }) {
  if (!show) return null;
  return (
    <div className="overlay">
      <div className="overlay-box">Loading...</div>
    </div>
  );
}
