require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// Allow requests from your Vercel frontend and localhost for development
const allowedOrigins = [
  'https://bms-wizcommerce-y24g.vercel.app', // no trailing slash!
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Required middleware
app.use(express.json());

// CORS test route
app.get('/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Confirm DB connection
pool.connect()
  .then(() => console.log(" PostgreSQL connected successfully"))
  .catch((err) => {
    console.error(" Failed to connect to PostgreSQL:", err.message);
    process.exit(1);
  });

const ensureTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        max_bookings_per_slot INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_slots (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        slot_time TIMESTAMP NOT NULL
      );
    `);

    console.log(" Tables checked/created successfully");
  } catch (err) {
    console.error(" Error ensuring tables:", err.message);
  }
};

ensureTables();

// POST 
app.post('/events', async (req, res) => {
  const { title, description, timeSlots, maxBookingsPerSlot } = req.body;

  // Log the incoming request body for debugging
  console.log('POST /events request body:', req.body);

  if (!title || !Array.isArray(timeSlots) || timeSlots.length === 0 || !maxBookingsPerSlot) {
    console.error('Validation failed:', {
      title,
      timeSlots,
      maxBookingsPerSlot
    });
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventResult = await client.query(
      'INSERT INTO events (title, description, max_bookings_per_slot) VALUES ($1, $2, $3) RETURNING id',
      [title, description, maxBookingsPerSlot]
    );

    const eventId = eventResult.rows[0].id;

    const slotInserts = timeSlots.map(slot =>
      client.query(
        'INSERT INTO event_slots (event_id, slot_time) VALUES ($1, $2)',
        [eventId, slot]
      )
    );

    await Promise.all(slotInserts);
    await client.query('COMMIT');

    res.status(201).json({ eventId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(" Error creating event:", err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    client.release();
  }
});

// GET 
app.get('/events', async (req, res) => {
  try {
    
    const eventsResult = await pool.query('SELECT id, title, description, max_bookings_per_slot FROM events ORDER BY id');
    const events = eventsResult.rows;
    if (events.length === 0) return res.json([]);

    
    const eventIds = events.map(e => e.id);
    const slotsResult = await pool.query(
      'SELECT id, event_id, slot_time FROM event_slots WHERE event_id = ANY($1) ORDER BY slot_time',
      [eventIds]
    );

    
    const slotsByEvent = {};
    for (const row of slotsResult.rows) {
      if (!slotsByEvent[row.event_id]) slotsByEvent[row.event_id] = [];
      slotsByEvent[row.event_id].push({
        id: row.id,
        slot_time: row.slot_time.toISOString()
      });
    }

    
    const result = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      maxBookingsPerSlot: event.max_bookings_per_slot,
      slots: slotsByEvent[event.id] || []
    }));

    res.json(result);
  } catch (err) {
    console.error(' Error fetching events:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});


// GET /
app.get('/events/:id', async (req, res) => {
  const eventId = req.params.id;
  try {
    
    const eventResult = await pool.query(
      'SELECT id, title, description, max_bookings_per_slot FROM events WHERE id = $1',
      [eventId]
    );
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = eventResult.rows[0];

    
    const slotsResult = await pool.query(
      'SELECT id, slot_time FROM event_slots WHERE event_id = $1 ORDER BY slot_time',
      [eventId]
    );
    const slots = slotsResult.rows.map(row => ({
      id: row.id,
      slot_time: row.slot_time.toISOString()
    }));

    res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      maxBookingsPerSlot: event.max_bookings_per_slot,
      slots
    });
  } catch (err) {
    console.error(' Error fetching event:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// POST /events/:id/bookings
app.post('/events/:id/bookings', async (req, res) => {
  const eventId = req.params.id;
  const { name, email, slotId } = req.body; 

  if (!name || !email || !slotId) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Confirm event exists and get max bookings
    const eventResult = await client.query(
      'SELECT max_bookings_per_slot FROM events WHERE id = $1',
      [eventId]
    );
    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found.' });
    }
    const maxBookingsPerSlot = eventResult.rows[0].max_bookings_per_slot;

    // Confirm slot belongs to this event
    const slotResult = await client.query(
      'SELECT id FROM event_slots WHERE id = $1 AND event_id = $2',
      [slotId, eventId]
    );
    if (slotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Slot does not belong to this event.' });
    }

    // Ensure bookings table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        slot_id INTEGER REFERENCES event_slots(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(slot_id, email)
      );
    `);

    // Check for duplicate booking
    const duplicateCheck = await client.query(
      'SELECT id FROM bookings WHERE slot_id = $1 AND email = $2',
      [slotId, email]
    );
    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You have already booked this slot.' });
    }

    // Check if slot is fully booked
    const bookingCount = await client.query(
      'SELECT COUNT(*) FROM bookings WHERE slot_id = $1',
      [slotId]
    );
    if (parseInt(bookingCount.rows[0].count, 10) >= maxBookingsPerSlot) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This slot is fully booked.' });
    }

    // Insert booking
    await client.query(
      'INSERT INTO bookings (event_id, slot_id, name, email) VALUES ($1, $2, $3, $4)',
      [eventId, slotId, name, email]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Booking successful.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(' Error during booking:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    client.release();
  }
});



// GET /users/:email/bookings - Get all bookings for a user by email
app.get('/users/:email/bookings', async (req, res) => {
  const email = req.params.email;
  try {
    const result = await pool.query(`
      SELECT 
        b.id AS booking_id,
        e.title AS event_title,
        e.description AS event_description,
        s.slot_time AS slot_time,
        b.created_at AS booking_created_at
      FROM bookings b
      JOIN event_slots s ON b.slot_id = s.id
      JOIN events e ON b.event_id = e.id
      WHERE b.email = $1
      ORDER BY b.created_at DESC
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No bookings found for this user.' });
    }

    const bookings = result.rows.map(row => ({
      eventTitle: row.event_title,
      eventDescription: row.event_description,
      slot: row.slot_time.toISOString(),
      bookingCreatedAt: row.booking_created_at.toISOString()
    }));

    res.json(bookings);
  } catch (err) {
    console.error(' Error fetching user bookings:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
