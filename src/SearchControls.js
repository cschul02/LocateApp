import React, { useState } from 'react';

export default function SearchControls({ initialParams, onSearch, styles }) {
  // Local state to manage the form inputs without triggering a re-fetch on every keystroke.
  const [city, setCity] = useState(initialParams.city);
  const [stateCode, setStateCode] = useState(initialParams.stateCode);
  const [radius, setRadius] = useState(initialParams.radius);

  // This function is called when the form is submitted.
  // It passes the new search parameters up to the main App component.
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents the page from reloading on form submission
    onSearch({ city, stateCode, radius });
  };

  return (
    <div style={styles.searchSection}>
      <form style={styles.searchContainer} onSubmit={handleSubmit}>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          style={{...styles.searchInput, flex: 2}} // Give city input more space
        />
        <input
          type="text"
          value={stateCode}
          onChange={(e) => setStateCode(e.target.value)}
          placeholder="State (e.g., CO)"
          style={{...styles.searchInput, flex: 1}} // State input is smaller
          maxLength="2"
        />
        <button type="submit" style={styles.searchButton}>Find</button>
      </form>

      <div style={styles.radiusContainer}>
        <label htmlFor="radius" style={styles.radiusLabel}>Search Radius: {radius} miles</label>
        <input
          type="range"
          id="radius"
          min="5"
          max="100"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          style={styles.radiusSlider}
        />
      </div>
    </div>
  );
}
