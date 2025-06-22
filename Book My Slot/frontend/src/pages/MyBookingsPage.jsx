import { useEffect, useState } from "react";
import axios from "axios";
import "./MyBookingsPage.css";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hardcoded user email for now
  const userEmail = "example@gmail.com";

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`http://localhost:3000/users/${userEmail}/bookings`)
      .then((res) => {
        setBookings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch bookings. Please try again later.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">{error}</div>
    );
  }

  return (
    <div className="my-bookings">
      <h2 className="section-title">My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <h3>No bookings found</h3>
          <p>You haven't booked any slots yet. Explore events and book your first slot!</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking, idx) => (
            <div key={idx} className="booking-card">
              <h3 className="booking-title">{booking.eventTitle}</h3>
              <p className="booking-description">{booking.eventDescription}</p>
              <div className="booking-meta">
                <span className="meta-label">Slot:</span>
                <span className="meta-value">
                  {booking.slot ? new Date(booking.slot).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </span>
              </div>
              <div className="booking-meta">
                <span className="meta-label">Booked at:</span>
                <span className="meta-value">
                  {booking.bookingCreatedAt ? new Date(booking.bookingCreatedAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}