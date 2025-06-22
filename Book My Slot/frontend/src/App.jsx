import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import EventDetailsPage from "./pages/EventDetailsPage";
import CreateEventPage from "./pages/CreateEventPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import Navbar from "./components/Navbar";
import './App.css'

export default function App() {
  return (
    <Router>
      <Navbar />
      <div className="max-w-3xl mx-auto mt-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/create" element={<CreateEventPage />} />
          <Route path="/bookings/:email" element={<MyBookingsPage />} />
        </Routes>
      </div>
      <footer className="text-center py-4 mt-8 text-gray-500">
        © 2025-Uday Arora-Book My Slot. All rights reserved.
      </footer>
    </Router>
  );
}
