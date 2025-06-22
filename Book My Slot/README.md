# 📅 Book My Slot – API Documentation

A full-stack event booking web app built using **React**, **Node.js**, and **PostgreSQL**. Users can create events with available time slots, book slots for an event, and view their own bookings based on email.


 Setup Instructions

### 1. Install Dependencies

```bash
npm install

Create a .env file in the root directory:
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<yourdbname>
PORT=3000

Start the Server-
node index.js

API Endpoints
POST /events
Request:
{
  "title": "React Workshop",
  "description": "Learn React basics and hooks",
  "timeSlots": [
    "2025-06-25T10:00:00Z",
    "2025-06-25T11:00:00Z"
  ],
  "maxBookingsPerSlot": 5
}

Response:
{
  "eventId": 1
}

GET /events

Response:

[
  {
    "id": 1,
    "title": "React Workshop",
    "description": "Learn React basics and hooks",
    "maxBookingsPerSlot": 5,
    "slots": [
      {
        "id": 1,
        "slot_time": "2025-06-25T10:00:00.000Z"
      }
    ]
  }
]

GET /events/:id
Response:
{
  "id": 1,
  "title": "React Workshop",
  "description": "Learn React basics and hooks",
  "maxBookingsPerSlot": 5,
  "slots": [
    {
      "id": 1,
      "slot_time": "2025-06-25T10:00:00.000Z"
    }
  ]
}
POST /events/:id/bookings
Book a time slot for a specific event.

Request:

{
  "name": "Uday Arora",
  "email": "uday@example.com",
  "slotId": 1
}

Success Response:

{
  "success": true,
  "message": "Booking successful."
}
Errors:

400 – Missing fields / invalid slot

409 – Duplicate booking / slot fully booked

GET /users/:email/bookings
View all bookings made by a user (based on email).

Example:
GET /users/uday@example.com/bookings

Response:
[
  {
    "eventTitle": "React Workshop",
    "eventDescription": "Learn React basics and hooks",
    "slot": "2025-06-25T10:00:00.000Z",
    "bookingCreatedAt": "2025-06-22T15:00:00.000Z"
  }
]
Features Implemented
✅ Create Events with time slots

✅ Limit max bookings per slot

✅ Prevent duplicate bookings (same slot & email)

✅ Book slots from frontend UI

✅ View "My Bookings" by email

✅ Modern UI with React + TailwindCSS

✅ Responsive and clean layout

✅ PostgreSQL-backed relational structure

✅ Secure and validated backend

Frontend Access
Make sure your React app runs on:
http://localhost:5173

Start it using:
npm run dev

Database Tables Used
events

event_slots

bookings

Tech Stack
Frontend: React, Vite, TailwindCSS

Backend: Node.js, Express.js

Database: PostgreSQL