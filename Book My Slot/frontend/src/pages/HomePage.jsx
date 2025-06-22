import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import './HomePage.css';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:3000/events")
      .then(res => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch events");
        setLoading(false);
      });
  }, []);

  return (
    <div className="home-page">
      <header className="hero-section">
        <h1>Welcome to <span className="highlight">Book My Slot</span></h1>
        <p className="subtitle">Find and book your perfect time slot with ease</p>
      </header>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading amazing events for you...</p>
        </div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : events.length === 0 ? (
        <div className="no-events">
          <h3>No events available at the moment</h3>
          <p>Check back later or create your own event!</p>
          <Link to="/create" className="create-button">Create Event</Link>
        </div>
      ) : (
        <>
          <h2 className="section-title">Upcoming Events</h2>
          <div className="events-grid">
            {events.map(event => (
              <div key={event.id} className="event-card">
                <h2>{event.title}</h2>
                <p>{event.description}</p>
                <div className="event-meta">
                  <div className="slots-count">
                    <span className="meta-icon">🕒</span> {event.slots.length} Available Slots
                  </div>
                </div>
                <Link to={`/events/${event.id}`} className="view-button">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}