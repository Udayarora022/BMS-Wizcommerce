import { useState } from "react";
import axios from "axios";
import './CreateEventPage.css';

export default function CreateEventPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slots, setSlots] = useState([""]);
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState("");
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSlotChange = (idx, value) => {
    const newSlots = [...slots];
    newSlots[idx] = value;
    setSlots(newSlots);
  };

  const addSlot = () => setSlots([...slots, ""]);
  const removeSlot = (idx) => setSlots(slots.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const formattedSlots = slots
        .filter(Boolean)
        .map(slot => slot ? new Date(slot).toISOString() : null)
        .filter(Boolean);
      await axios.post("http://localhost:3000/events", {
        title,
        description,
        timeSlots: formattedSlots,
        maxBookingsPerSlot: Number(maxBookingsPerSlot)
      }, {
        withCredentials: true
      });
      setMessage({ type: "success", text: "Event created successfully!" });
      setTitle("");
      setDescription("");
      setSlots([""]);
      setMaxBookingsPerSlot("");
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to create event." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-event-wrapper">
      <div className="page-header">
        <h1>Create New Event</h1>
        <p className="subtitle">Schedule and manage your event slots efficiently</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="create-event-container">
          <section className="form-section details">
            <h3>Event Details</h3>
            <div className="input-group">
              <label>Event Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your event"
                rows="4"
              />
            </div>
          </section>

          <div className="slots-and-limits">
            <section className="form-section">
              <h3>Time Slots</h3>
              <div className="slots-container">
                {slots.map((slot, idx) => (
                  <div key={idx} className="slot-group">
                    <input
                      type="datetime-local"
                      value={slot}
                      onChange={e => handleSlotChange(idx, e.target.value)}
                      required
                    />
                    {slots.length > 1 && (
                      <button 
                        type="button"
                        className="remove-slot"
                        onClick={() => removeSlot(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="add-slot" onClick={addSlot}>
                  + Add Another Time Slot
                </button>
              </div>
            </section>

            <section className="form-section">
              <h3>Booking Limits</h3>
              <div className="input-group">
                <label>Maximum Bookings Per Slot</label>
                <input
                  type="number"
                  min="1"
                  value={maxBookingsPerSlot}
                  onChange={e => setMaxBookingsPerSlot(e.target.value)}
                  placeholder="Enter max bookings per slot"
                  required
                />
              </div>
            </section>
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? "Creating Event..." : "Create Event"}
          </button>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}