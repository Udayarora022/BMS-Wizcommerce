import { Link } from "react-router-dom";
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Book My Slot
      </Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/create">Create Event</Link>
        <Link to="/bookings">My Bookings</Link>
      </div>
    </nav>
  );
}
