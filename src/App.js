import React, { useState, useMemo, useEffect } from 'react';
import SportsScreen from './SportsScreen';
import MusicScreen from './MusicScreen';
import SearchControls from './SearchControls';

// --- 1. API CONFIGURATION ---
// These constants hold your API keys. It's best practice to store these
// in environment variables in a real application for security.
const TICKETMASTER_API_KEY = 'secret';
const GOOGLE_PLACES_API_KEY = 'secret';
// Note: The Gemini API key is handled by the environment and is not needed here.

// --- 2. API SERVICE ---
// This object centralizes all external API calls.
const api = {
  /**
   * Fetches events from the Ticketmaster API based on a city and radius.
   * @param {string} city - The city to search for events in.
   * @param {number} radius - The search radius in miles.
   * @returns {Promise<Array>} A promise that resolves to an array of event objects.
   */
  // Add 'category = null' as a new parameter
  fetchTicketmasterEvents: async (city, stateCode, radius, category = null) => {
    // Add the classificationName to the URL if a category is provided
    let classificationQuery = category ? `&classificationName=${category}` : '';
    const TICKETMASTER_ENDPOINT = `https://app.ticketmaster.com/discovery/v2/events.json?city=${city}&stateCode=${stateCode}&radius=${radius}&unit=miles${classificationQuery}&apikey=${TICKETMASTER_API_KEY}`;
    // ... rest of the function remains the same


    try {
      const response = await fetch(TICKETMASTER_ENDPOINT);
      const data = await response.json();
      // Check if the API returned any events.
      if (!data._embedded || !data._embedded.events || data._embedded.events.length === 0) {
        console.warn(`No events found for ${city}. Falling back to mock data.`);
        return mockApi.fetchTicketmasterEvents(); // Use mock data as a fallback.
      }
      // Map the complex API response to a simpler object structure for the app.
      return data._embedded.events.map(event => ({
        id: event.id,
        name: event.name,
        category: event.classifications?.[0]?.segment?.name || 'Social',
        subcategory: event.classifications?.[0]?.subGenre?.name || 'N/A',
        date: event.dates?.start?.dateTime,
        venueName: event._embedded?.venues?.[0]?.name,
        imageUrl: event.images?.find(img => img.ratio === '16_9')?.url || 'https://placehold.co/600x400/1a202c/ffffff?text=Event',
        address: `${event._embedded?.venues?.[0]?.address?.line1}, ${event._embedded?.venues?.[0]?.city?.name}, ${event._embedded?.venues?.[0]?.state?.stateCode}`,
      }));
    } catch (error) {
      console.error("Error fetching from Ticketmaster API:", error);
      return mockApi.fetchTicketmasterEvents(); // Use mock data on error.
    }
  },

  /**
   * Fetches place details from Google Places API.
   * NOTE: In a real app, this should be done via a server-side proxy to avoid CORS issues.
   * @param {string} address - The address to look up.
   * @returns {Promise<Object>} A promise that resolves to an object with place details.
   */
  fetchGooglePlaceDetails: async (address) => {
    // For the demo, we directly return mock data.
    return mockApi.fetchGooglePlaceDetails(address);
  },

  /**
   * Generates a "night plan" using the Gemini API.
   * @param {Object} event - The event object to create a plan for.
   * @returns {Promise<string>} A promise that resolves to a string containing the generated plan.
   */
  generateNightPlan: async (event) => {
    console.log("Generating night plan with Gemini...");
    // Create a detailed prompt for the AI model.
    const prompt = `Create a fun, brief plan for a night out based on this event. Event: "${event.name}" at ${event.venueName} on ${new Date(event.date).toLocaleDateString()}. The plan should have three short parts: a pre-event suggestion (like a themed bar or quick bite nearby), a post-event suggestion (like a late-night food spot or a place to unwind), and a fun conversation starter related to the event. Make it sound exciting and engaging.`;
    
    try {
        // Prepare the payload for the Gemini API.
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = "" // The key is handled by the environment.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        // Make the API call.
        const response = await fetch(apiUrl, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(payload)
               });
        const result = await response.json();

        // Safely parse the response from the AI.
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
          const text = result.candidates[0].content.parts[0].text;
          return text;
        } else {
          return "Could not generate a plan at this time. Please try again later.";
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Sorry, I couldn't come up with a plan right now. Check your connection and try again.";
    }
  },
};

// --- MOCK API SERVICE ---
// This provides fallback data for development and when live APIs fail.
const mockApi = {
  fetchTicketmasterEvents: async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay.
    console.log("Fetching DYNAMIC MOCK events...");
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date(); nextMonth.setMonth(today.getMonth() + 1);

    return [
      { id: 'tm-1', name: 'Mock: Indie Showcase', category: 'Music', date: today.toISOString(), venueName: 'The Mockingbird Theater', imageUrl: 'https://placehold.co/600x400/1a202c/ffffff?text=Mock+Music', address: '123 Mock St, Denver, CO' },
      { id: 'tm-2', name: 'Mock: Broncos Game', category: 'Sports', subcategory: 'NFL', date: today.toISOString(), venueName: 'Mock Field', imageUrl: 'https://placehold.co/600x400/FB4F14/ffffff?text=Mock+Football', address: '456 Mock Ave, Denver, CO' },
      { id: 'tm-3', name: 'Mock: Jazz Night', category: 'Music', date: tomorrow.toISOString(), venueName: 'The Mock Note', imageUrl: 'https://placehold.co/600x400/4a5568/ffffff?text=Mock+Jazz', address: '789 Mock Blvd, Denver, CO' },
      { id: 'tm-4', name: 'Mock: Nuggets Game', category: 'Sports', subcategory: 'NBA', date: nextWeek.toISOString(), venueName: 'Mock Arena', imageUrl: 'https://placehold.co/600x400/0E2240/ffffff?text=Mock+Basketball', address: '111 Mock Ct, Denver, CO'},
      { id: 'tm-5', name: 'Mock: Art Festival', category: 'Social', date: nextMonth.toISOString(), venueName: 'Mock Museum', imageUrl: 'https://placehold.co/600x400/718096/ffffff?text=Mock+Art', address: '222 Mock Ln, Denver, CO'},
    ];
  },
  fetchGooglePlaceDetails: async (address) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { rating: 4.5, userRatingsTotal: 1337 };
  },
};

// --- STYLES ---
// A JavaScript object containing all the CSS styles for the components.
// This approach is common in React for component-specific styling.
const styles = {
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '420px', margin: '0 auto', height: '70px', backgroundColor: '#1E1E1E', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid #2D2D2D' },
  navButton: { background: 'none', border: 'none', color: '#B3B3B3', fontSize: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  navButtonActive: { color: '#1DB954' },
  navButtonText: { fontSize: '12px' },
//added nav bar component
  safeArea: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#121212', color: '#FFFFFF', minHeight: '100vh' },
  container: { maxWidth: '420px', margin: '0 auto', backgroundColor: '#121212', position: 'relative', minHeight: '100vh' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' },
  loadingText: { fontSize: '20px', color: '#B3B3B3', marginTop: '10px' },
  header: { padding: '20px 20px 0 20px' },
  headerTitle: { fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', margin: 0, textTransform: 'capitalize' },
  searchContainer: { display: 'flex', gap: '10px', padding: '15px 20px' },
  searchInput: { flex: 1, padding: '10px 15px', fontSize: '16px', border: '1px solid #2D2D2D', borderRadius: '8px', backgroundColor: '#1E1E1E', color: '#FFFFFF' },
  searchButton: { padding: '10px 15px', border: 'none', borderRadius: '8px', backgroundColor: '#1DB954', color: '#FFFFFF', fontWeight: 'bold', cursor: 'pointer' },
  radiusContainer: { padding: '0 20px 15px 20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  radiusLabel: { fontSize: '14px', color: '#B3B3B3', textAlign: 'center' },
  radiusSlider: { width: '100%', cursor: 'pointer' },
  filtersContainer: { padding: '0 20px 15px 20px', background: '#121212', position: 'sticky', top: 0, zIndex: 10 },
  timeFilters: { display: 'flex', justifyContent: 'space-around', marginBottom: '15px', backgroundColor: '#2D2D2D', borderRadius: '8px', padding: '4px' },
  timeFilterButton: { flex: 1, padding: '10px 5px', border: 'none', background: 'transparent', color: '#B3B3B3', fontSize: '14px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' },
  timeFilterButtonActive: { background: '#1DB954', color: '#FFFFFF' },
  categoryFilters: { overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px' },
  categoryFilterButton: { display: 'inline-block', padding: '8px 16px', backgroundColor: '#2D2D2D', borderRadius: '20px', marginRight: '10px', border: 'none', color: '#FFFFFF', fontSize: '14px', cursor: 'pointer' },
  categoryFilterButtonActive: { backgroundColor: '#1DB954', fontWeight: 'bold' },
  eventList: { padding: '0 20px 80px 20px' },
  noEventsContainer: { textAlign: 'center', marginTop: '50px', color: '#B3B3B3' },
  noEventsText: { fontSize: '18px' },
  card: { backgroundColor: '#1E1E1E', borderRadius: '12px', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer' },
  cardImage: { width: '100%', height: '180px', objectFit: 'cover' },
  cardContent: { padding: '15px' },
  cardTitle: { fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 },
  cardVenue: { fontSize: '14px', color: '#B3B3B3', marginTop: '5px' },
  cardTime: { fontSize: '14px', color: '#1DB954', fontWeight: 'bold', marginTop: '10px' },
  fab: { position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1DB954', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.6)', cursor: 'pointer', border: 'none', fontSize: '28px', zIndex: 1000 },
  detailsContainer: { backgroundColor: '#121212' },
  detailsImageContainer: { position: 'relative' },
  detailsImage: { width: '100%', height: '300px', objectFit: 'cover' },
  backButton: { position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(0,0,0,0.5)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  detailsContent: { padding: '20px' },
  detailsTitle: { fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 },
  detailsSubtitle: { fontSize: '16px', color: '#B3B3B3', marginTop: '5px' },
  separator: { height: '1px', backgroundColor: '#2D2D2D', margin: '20px 0' },
  detailsVenue: { fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' },
  detailsAddress: { fontSize: '16px', color: '#B3B3B3', marginTop: '5px' },
  detailsDescription: { fontSize: '16px', color: '#FFFFFF', marginTop: '20px', lineHeight: '1.5', fontStyle: 'italic' },
  detailsActions: { padding: '20px' },
  actionButton: { backgroundColor: '#2D2D2D', padding: '15px', borderRadius: '30px', textAlign: 'center', marginBottom: '10px', border: 'none', color: '#FFFFFF', fontSize: '16px', fontWeight: 'bold', width: '100%', cursor: 'pointer' },
  primaryButton: { backgroundColor: '#1DB954' },
  geminiButton: { backgroundColor: '#4A90E2', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  geminiPlanContainer: { backgroundColor: '#1E1E1E', borderRadius: '12px', padding: '20px', margin: '0 20px 20px 20px' },
  geminiPlanTitle: { fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '15px' },
  geminiPlanText: { fontSize: '16px', color: '#E0E0E0', whiteSpace: 'pre-wrap', lineHeight: '1.6' },
  modalContainer: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000 },
  modalContent: { backgroundColor: '#1E1E1E', borderRadius: '20px', padding: '20px', width: '90%', maxWidth: '380px', textAlign: 'center' },
  modalHeader: { fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 },
  modalSubHeader: { fontSize: '16px', color: '#B3B3B3', marginBottom: '20px' },
  modalActions: { width: '100%', marginTop: '20px' },
  closeButton: { marginTop: '10px', background: 'none', border: 'none', color: '#B3B3B3', fontSize: '16px', cursor: 'pointer' },
};

// --- Reusable Components ---

/**
 * A card component to display a single event.
 * @param {{ event: Object, onPress: Function }} props
 */
const EventCard = ({ event, onPress }) => (
  <div style={styles.card} onClick={() => onPress(event)}>
    <img src={event.imageUrl} alt={event.name} style={styles.cardImage} />
    <div style={styles.cardContent}>
      <h3 style={styles.cardTitle}>{event.name}</h3>
      <p style={styles.cardVenue}>{event.venueName} • ⭐ {event.googleData?.rating || 'N/A'}</p>
      <p style={styles.cardTime}>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
);

// --- Screen Components ---

/**
 * The main screen for discovering events.
 */
const DiscoverScreen = ({ events, onEventSelect, onFindMyNight, timeFilter, setTimeFilter, categoryFilter, setCategoryFilter, radius, setRadius, city, handleCityChange }) => {
  const [cityInput, setCityInput] = useState(city);
  const timeCategories = ['Today', 'This Week', 'This Month', 'Next Month'];
  const eventCategories = ['All', 'Music', 'Sports', 'Social'];
  const sportsSubCategories = ['NFL', 'NBA', 'MLB', 'NHL'];

  const handleSearch = (e) => {
    e.preventDefault();
    handleCityChange(cityInput);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Events in {city}</h1>
      </header>
      
      <form style={styles.searchContainer} onSubmit={handleSearch}>
        <input 
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="Search for a city..."
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>Search</button>
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

      <div style={styles.filtersContainer}>
        <div style={styles.timeFilters}>
          {timeCategories.map(time => (<button key={time} onClick={() => setTimeFilter(time)} style={{ ...styles.timeFilterButton, ...(timeFilter === time ? styles.timeFilterButtonActive : {}) }}>{time}</button>))}
        </div>
        <div style={styles.categoryFilters}>
          {eventCategories.map(category => (<button key={category} onClick={() => setCategoryFilter(category)} style={{ ...styles.categoryFilterButton, ...(categoryFilter === category ? styles.categoryFilterButtonActive : {}) }}>{category}</button>))}
          {/* Show sports subcategories only when 'Sports' is selected */}
          {categoryFilter === 'Sports' && sportsSubCategories.map(subCategory => (<button key={subCategory} onClick={() => setCategoryFilter(subCategory)} style={{ ...styles.categoryFilterButton, ...(categoryFilter === subCategory ? styles.categoryFilterButtonActive : {}) }}>{subCategory}</button>))}
        </div>
      </div>

      <main style={styles.eventList}>
        {events.length > 0 ? (
          events.map(event => <EventCard key={event.id} event={event} onPress={onEventSelect} />)
        ) : (
          <div style={styles.noEventsContainer}><p style={styles.noEventsText}>No events match your filters.</p></div>
        )}
      </main>

      <button style={styles.fab} onClick={() => onFindMyNight(events)} aria-label="Find my night">🎲</button>
    </div>
  );
};

/**
 * The screen that shows detailed information about a selected event.
 */
const EventDetailsScreen = ({ event, onBack }) => {
  const [plan, setPlan] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);

  // Calls the Gemini API to generate an itinerary.
  const handlePlanMyNight = async () => {
    setIsPlanning(true);
    const result = await api.generateNightPlan(event);
    setPlan(result);
    setIsPlanning(false);
  };

  return (
    <div style={styles.detailsContainer}>
      <div style={styles.detailsImageContainer}>
        <img src={event.imageUrl} alt={event.name} style={styles.detailsImage} />
        <button style={styles.backButton} onClick={onBack}>←</button>
      </div>
      <div style={styles.detailsContent}>
        <h1 style={styles.detailsTitle}>{event.name}</h1>
        <p style={styles.detailsSubtitle}>{new Date(event.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <div style={styles.separator} />
        <p style={styles.detailsVenue}>{event.venueName}</p>
        <p style={styles.detailsAddress}>{event.address}</p>
        {event.googleData && <p style={styles.detailsDescription}>Google Rating: {event.googleData.rating} ({event.googleData.userRatingsTotal.toLocaleString()} reviews)</p>}
      </div>
      
      {/* This section only appears after the Gemini plan is generated */}
      {plan && (
        <div style={styles.geminiPlanContainer}>
            <h2 style={styles.geminiPlanTitle}>✨ Your AI-Powered Itinerary</h2>
            <p style={styles.geminiPlanText}>{plan}</p>
        </div>
      )}

      <div style={styles.detailsActions}>
        <button style={{...styles.actionButton, ...styles.geminiButton}} onClick={handlePlanMyNight} disabled={isPlanning}>
          {isPlanning ? 'Planning...' : <>✨ Plan My Night</>}
        </button>
        <button style={{...styles.actionButton, ...styles.primaryButton}}>
          Get Directions
        </button>
        <button style={styles.actionButton}>
          Buy Tickets
        </button>
      </div>
    </div>
  );
};

/**
 * A modal component for the "Find My Night" feature.
 */
const FindMyNightModal = ({ visible, event, onAccept, onRetry, onClose }) => {
  if (!visible || !event) return null;
  return (
    <div style={styles.modalContainer} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalHeader}>Your night is planned!</h2>
        <p style={styles.modalSubHeader}>How about some {event.category.toLowerCase()}?</p>
        <div style={styles.card} onClick={() => { onAccept(); onClose(); }}>
          <img src={event.imageUrl} alt={event.name} style={styles.cardImage} />
          <div style={styles.cardContent}>
            <h3 style={styles.cardTitle}>{event.name}</h3>
            <p style={styles.cardVenue}>{event.venueName} • ⭐ {event.googleData?.rating || 'N/A'}</p>
            <p style={styles.cardTime}>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div style={styles.modalActions}>
           <button style={{...styles.actionButton, ...styles.primaryButton}} onClick={() => { onAccept(); onClose(); }}>
             Let's Go!
           </button>
           <button style={styles.actionButton} onClick={onRetry}>
             Try Again
           </button>
        </div>
        <button style={styles.closeButton} onClick={onClose}>Maybe Later</button>
      </div>
    </div>
  );
};

// --- Main App Component ---
// This is the root component that manages the overall state and renders other components.
export default function App() {
  // Modular applicaqtion state management using React hooks.
  const [activeModule, setActiveModule] = useState('Sports'); // Sports Module
  // State for storing all events fetched from the API.
  
  // State to show a loading indicator while fetching data.
 
  // State to track which event is currently selected to view details.
  const [selectedEvent, setSelectedEvent] = useState(null);
  // State for the "Find My Night" modal visibility.
  const [findMyNightVisible, setFindMyNightVisible] = useState(false);
  // State for the event suggested by "Find My Night".
  const [suggestedEvent, setSuggestedEvent] = useState(null);
  // State for the active time filter ('Today', 'This Week', etc.).
  
  // State for the active category filter ('All', 'Music', etc.).
  
  // State for the search radius slider.
  const [searchParams, setSearchParams] = useState({ city: 'Denver', stateCode: 'CO', radius: 50 });

  // --- Event Handlers ---
  const handleEventSelect = (event) => {
    window.scrollTo(0, 0);
    setSelectedEvent(event);
  };
  const handleBack = () => { setSelectedEvent(null); };
 
  const handleAcceptSuggestion = () => {
    setFindMyNightVisible(false);
    setTimeout(() => {
      window.scrollTo(0, 0);
      setSelectedEvent(suggestedEvent);
    }, 100);
  };

  let content; 

  // 2. We check which module is currently active.
  if (activeModule === 'Sports') {
    // If 'Sports' is active, we put the SportsScreen component into our placeholder.
    content = <SportsScreen onEventSelect={handleEventSelect} api={api} styles={styles} searchParams={searchParams} />;
  } else if (activeModule === 'Music') {
    // Otherwise, we show a "Coming Soon" message for Music...
    content = <MusicScreen onEventSelect={handleEventSelect} api={api} styles={styles} searchParams={searchParams}/>;
  } else {
    // ...and for Social.
    content = <div style={styles.container}><h1 style={styles.headerTitle}>Social Coming Soon</h1></div>;
  }


  // Main render logic: show details screen if an event is selected, otherwise show the discover screen.
  return (
    <div style={styles.safeArea}>
      {selectedEvent ? (
        <EventDetailsScreen event={selectedEvent} onBack={handleBack} />
      ) : (
        <>
          <SearchControls initialParams={searchParams} onSearch={setSearchParams} styles={styles} />
          {content}
        </>
      )}

      <FindMyNightModal visible={findMyNightVisible} event={suggestedEvent} onAccept={handleAcceptSuggestion} onRetry={() => setFindMyNightVisible(false)} set onClose={() => setFindMyNightVisible(false)} />
        <nav style={styles.bottomNav}>
          <button style={{...styles.navButton, ...(activeModule === 'Sports' ? styles.navButtonActive : {})}} onClick={() => setActiveModule('Sports')}>
              🏟️
              <span style={styles.navButtonText}>Sports</span>
          </button>
          <button style={{...styles.navButton, ...(activeModule === 'Music' ? styles.navButtonActive : {})}} onClick={() => setActiveModule('Music')}>
              🎵
              <span style={styles.navButtonText}>Music</span>
          </button>
          <button style={{...styles.navButton, ...(activeModule === 'Social' ? styles.navButtonActive : {})}} onClick={() => setActiveModule('Social')}>
              🍻
              <span style={styles.navButtonText}>Social</span>
          </button>
      </nav> 
    </div>
  );
}
