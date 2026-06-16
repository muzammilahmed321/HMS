import { getPool } from "../config/db.js";

import { sendBookingNotification } from "../../emailservice.js";

// POST /api/bookings - Customer creates booking
export const createBooking = async (req, res) => {
  const { hotelId, checkIn, checkOut, roomIds, adults, children } = req.body;
  const userId = req.user.userId;

  if (!hotelId || !checkIn || !checkOut || !roomIds || roomIds.length === 0) {
    return res.status(400).json({ message: "Missing required booking fields" });
  }
  console.log('hi');

  try {
    const pool = await getPool();

    const roomPlaceholders = roomIds.map((_, i) => `$${i + 1}`).join(",");
    const roomsResult = await pool.query(
      `SELECT "roomid", "roomname", "price" FROM "room" WHERE "roomid" IN (${roomPlaceholders})`,
      roomIds
    );
    const rooms = roomsResult.rows;
    // 2. Calculate pricing
    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0)
      return res.status(400).json({ message: "Invalid date range" });

    const baseTotal = rooms.reduce((sum, r) => sum + parseFloat(r.price), 0);
    const extraAdults = Math.max(0, (adults || 1) - 2);
    const grandTotal = baseTotal * nights + extraAdults * 20 * nights;

    // 3. Create booking record
    const result = await pool.query(
      `INSERT INTO "booking"
   ("userid","hotelid","bookingdate","checkin","checkout","grandtotal","status")
   VALUES ($1,$2,$3,$4,$5,$6,$7)
   RETURNING "bookingid"`,
      [
        userId,
        hotelId,
        new Date(),
        checkIn,
        checkOut,
        grandTotal,
        "Confirmed"
      ]
    );

    const bookingId = result.rows[0].bookingid;
    // 4. Link rooms and mark occupied
    for (const roomId of roomIds) {
      await pool.query(
        'INSERT INTO "booking_room" ("bookingid","roomid") VALUES ($1,$2)',
        [bookingId, roomId]
      );
      await pool.query(`UPDATE "room" SET "status"='Occupied' WHERE "roomid"=$1`, [roomId]);
    }

    // 5. Fetch hotel, guest, and all admin emails for notification
    const [hotelRes, guestRes, adminRes] = await Promise.all([
      pool.query('SELECT "name","location" FROM "hotel" WHERE "hotelid" = $1', [hotelId]),
      pool.query('SELECT "name","email","phone" FROM "users" WHERE "userid" = $1', [userId]),
      pool.query('SELECT "email" FROM "users" WHERE "roleid" = 1'),
    ]);

    const hotel = hotelRes.rows[0];
    const guest = guestRes.rows[0];
    const adminEmails = adminRes.rows.map((a) => a.Email).filter(Boolean);
    // 6. Send email non-blocking
    sendBookingNotification({
      adminEmails,
      bookingId,
      guestName: guest?.Name || "Guest",
      guestEmail: guest?.Email || "",
      guestPhone: guest?.Phone || "",
      hotelName: hotel?.Name || "Hotel",
      hotelLocation: hotel?.Location || "",
      rooms,
      grandTotal,
      checkIn,
      checkOut,
      adults: adults || 1,
      children: children || 0,
    }).catch((err) => {
      console.error("Email notification failed:", err.message);
    });

    res.status(201).json({ message: "Booking confirmed", bookingId, grandTotal, nights });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
    console.log(err.message);
  }
};

// GET /api/bookings/my - Customer own bookings
export const getMyBookings = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT b.*, h."name" AS "hotelname", h."location",
    (SELECT STRING_AGG(r."roomname", ', ') FROM "booking_room" br JOIN "room" r ON br."roomid" = r."roomid" WHERE br."bookingid" = b."bookingid") AS "rooms"
   FROM "booking" b
   JOIN "hotel" h ON b."hotelid" = h."hotelid"
   WHERE b."userid" = $1
   ORDER BY b."bookingdate" DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings - Admin all bookings
export const getAllBookings = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
  SELECT b.*, h."name" AS "hotelname", h."location", u."name" AS "guestname", u."email" AS "guestemail", u."phone" AS "guestphone",
    (SELECT STRING_AGG(r."roomname", ', ') FROM "booking_room" br JOIN "room" r ON br."roomid" = r."roomid" WHERE br."bookingid" = b."bookingid") AS "rooms"
  FROM "booking" b
  JOIN "hotel" h ON b."hotelid" = h."hotelid"
  JOIN "users" u ON b."userid" = u."userid"
  ORDER BY b."bookingid" DESC
`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/bookings/:id/status
export const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Confirmed", "Cancelled", "Completed"];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  try {
    const pool = await getPool();
    await pool.query('UPDATE "booking" SET "status"=$1 WHERE "bookingid"=$2', [status, req.params.id]);

    if (status === "Cancelled") {
      const rooms = await pool.query('SELECT "roomid" FROM "booking_room" WHERE "bookingid"=$1', [req.params.id]);
      for (const r of rooms.rows) {
        await pool.query(`UPDATE "room" SET "status"='Available' WHERE "roomid"=$1`, [r.RoomID]);
      }
    }

    res.json({ message: "Booking status updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/:id
export const getBookingById = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT b.*, h."name" AS "hotelname", h."location", u."name" AS "guestname"
   FROM "booking" b JOIN "hotel" h ON b."hotelid" = h."hotelid" JOIN "users" u ON b."userid" = u."userid"
   WHERE b."bookingid" = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Booking not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};