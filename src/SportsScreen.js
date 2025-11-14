import React, { useState, useMemo, useEffect } from 'react';

// --- Reusable Components (Copied from App.js for standalone use) ---

const EventCard = ({ event, onPress, styles }) => (
  <div style={styles.card} onClick={() => onPress(event)}>
    <img src={event.imageUrl} alt={event.name} style={styles.cardImage} />
    <div style={styles.cardContent}>
      <h3 style={styles.cardTitle}>{event.name}</h3>
      <p style={styles.cardVenue}>{event.venueName}</p>
      <p style={styles.cardTime}>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
);

const LoadingSpinner = ({ styles }) => (
    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" fill="#fff"/><path d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z" fill="#fff"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></path></svg>
);


// --- Sports Module Component ---

export default function SportsScreen({ onEventSelect, api, styles, searchParams }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [categoryFilter, setCategoryFilter] = useState('Sports'); // Default to 'Sports'

  useEffect(() => {
    const loadSportsData = async () => {
      setIsLoading(true);
      // This is the dedicated API call specifically for sports events.
      const sportsEvents = await api.fetchTicketmasterEvents(searchParams.city,searchParams.stateCode, searchParams.radius, 'Sports');
      setEvents(sportsEvents);
      setIsLoading(false);
    };
    loadSportsData();
  }, [searchParams, api]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    const endOfDay = new Date(now).setHours(23, 59, 59, 999);
    const endOfWeek = new Date(startOfDay).setDate(new Date(startOfDay).getDate() - new Date(startOfDay).getDay() + 7);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).setHours(23, 59, 59, 999);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0).setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventDate = new Date(event.date);
      let timeMatch = false;
      if (timeFilter === 'Today') timeMatch = eventDate >= startOfDay && eventDate <= endOfDay;
      else if (timeFilter === 'This Week') timeMatch = eventDate >= startOfDay && eventDate <= endOfWeek;
      else if (timeFilter === 'This Month') timeMatch = eventDate >= startOfDay && eventDate <= endOfMonth;
      else if (timeFilter === 'Next Month') timeMatch = eventDate > endOfMonth && eventDate <= endOfNextMonth;

      let categoryMatch = false;
      if (categoryFilter === 'Sports') categoryMatch = true; // Shows all sports
      else if (['NFL', 'NBA', 'MLB', 'NHL'].includes(categoryFilter)) {
        // More robust check for subcategory
        categoryMatch = event.subcategory && event.subcategory.includes(categoryFilter);
      }
      
      return timeMatch && categoryMatch;
    });
  }, [events, timeFilter, categoryFilter]);

  if (isLoading) {
    return (
      <div style={{ ...styles.safeArea, ...styles.loadingContainer }}>
        <LoadingSpinner styles={styles} />
        <p style={styles.loadingText}>Finding games in {searchParams.city}...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
       <header style={styles.header}>
        <h1 style={styles.headerTitle}>Sports in {searchParams.city}</h1>
      </header>

      {/* Note: Search and Radius controls could be passed down as props or managed here */}

      <div style={styles.filtersContainer}>
        <div style={styles.timeFilters}>
          {['Today', 'This Week', 'This Month', 'Next Month'].map(time => (
            <button key={time} onClick={() => setTimeFilter(time)} style={{ ...styles.timeFilterButton, ...(timeFilter === time ? styles.timeFilterButtonActive : {}) }}>
              {time}
            </button>
          ))}
        </div>
        <div style={styles.categoryFilters}>
            {['Sports', 'NFL', 'NBA', 'MLB', 'NHL'].map(category => (
                 <button key={category} onClick={() => setCategoryFilter(category)} style={{ ...styles.categoryFilterButton, ...(categoryFilter === category ? styles.categoryFilterButtonActive : {}) }}>
                    {category}
                 </button>
            ))}
        </div>
      </div>

      <main style={styles.eventList}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => <EventCard key={event.id} event={event} onPress={onEventSelect} styles={styles} />)
        ) : (
          <div style={styles.noEventsContainer}>
            <p style={styles.noEventsText}>No games match your filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
