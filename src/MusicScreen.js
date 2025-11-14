import React, { useState, useMemo, useEffect } from 'react';

// --- Reusable Components (Can be shared across modules) ---

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


// --- Live Music Module Component ---

export default function MusicScreen({ onEventSelect, api, styles, searchParams }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [genreFilter, setGenreFilter] = useState('Music'); // Default to 'Music' for all genres

  useEffect(() => {
    const loadMusicData = async () => {
      setIsLoading(true);
      // Dedicated API call specifically for music events.

      
      const musicEvents = await api.fetchTicketmasterEvents(searchParams.city, searchParams.stateCode, searchParams.radius, 'Music');
      setEvents(musicEvents);
      setIsLoading(false);
    };
    loadMusicData();
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
      if (genreFilter === 'Music') categoryMatch = true; // Shows all music
      else {
        // This checks if the event's subcategory (genre) matches the filter
        categoryMatch = event.subcategory && event.subcategory.toLowerCase().includes(genreFilter.toLowerCase());
      }
      
      return timeMatch && categoryMatch;
    });
  }, [events, timeFilter, genreFilter]);

  if (isLoading) {
    return (
      <div style={{ ...styles.safeArea, ...styles.loadingContainer }}>
        <LoadingSpinner styles={styles} />
        <p style={styles.loadingText}>Finding music in {searchParams.city}...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
       <header style={styles.header}>
        <h1 style={styles.headerTitle}>Live Music in {searchParams.city}</h1>
      </header>

      <div style={styles.filtersContainer}>
        <div style={styles.timeFilters}>
          {['Today', 'This Week', 'This Month', 'Next Month'].map(time => (
            <button key={time} onClick={() => setTimeFilter(time)} style={{ ...styles.timeFilterButton, ...(timeFilter === time ? styles.timeFilterButtonActive : {}) }}>
              {time}
            </button>
          ))}
        </div>
        <div style={styles.categoryFilters}>
            {/* These can be expanded with more genres */}
            {['Music', 'Rock', 'Hip-Hop', 'Electronic', 'Country'].map(genre => (
                 <button key={genre} onClick={() => setGenreFilter(genre)} style={{ ...styles.categoryFilterButton, ...(genreFilter === genre ? styles.categoryFilterButtonActive : {}) }}>
                    {genre}
                 </button>
            ))}
        </div>
      </div>

      <main style={styles.eventList}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => <EventCard key={event.id} event={event} onPress={onEventSelect} styles={styles} />)
        ) : (
          <div style={styles.noEventsContainer}>
            <p style={styles.noEventsText}>No concerts match your filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
