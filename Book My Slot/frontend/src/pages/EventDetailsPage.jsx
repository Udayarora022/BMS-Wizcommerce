import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import './EventDetailsPage.css';

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:3000/events/${id}`)
      .then(res => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Event not found");
        setLoading(false);
      });
  }, [id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:3000/events/${id}/bookings`, {
        name,
        email,
        slotId: selectedSlot.id,
      });
      setMessage({ type: "success", text: "Booking successful! Check your email for details." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Booking failed." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading event details...</p>
    </div>
  );
  
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="event-details">
      <h2 className="event-title">{event.title}</h2>
      <p className="event-description">{event.description}</p>
      
      <div className="slots-section">
        <h3 className="section-title">Available Time Slots</h3>
        {event.slots.length === 0 ? (
          <div className="no-slots">No slots available</div>
        ) : (
          <div className="slots-container">
            {event.slots.map(slot => (
              <button
                key={slot.id}
                type="button"
                className={`slot-button ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                onClick={() => setSelectedSlot(slot)}
              >
                {new Date(slot.slot_time).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="booking-form">
          <h3 className="section-title">Book This Slot</h3>
          <form onSubmit={handleBooking}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Confirm Booking"}
            </button>
          </form>
          
          {message && (
            <div className={message.type === "success" ? "success-message" : "error-message"}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}