import { getPool } from "../config/db.js";
// GET /api/hotels/:hotelId/rooms
export const getRoomsByHotel = async (req, res) => {
  try {
    const pool = await getPool();
   const result = await pool.query('SELECT * FROM "room" WHERE "hotelid" = $1 ORDER BY "roomid"', [req.params.hotelId]);
res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rooms/available - for booking search
export const getAvailableRooms = async (req, res) => {
  const { hotelId, checkIn, checkOut } = req.query;
  try {
    const pool = await getPool();
   const result = await pool.query(
  `SELECT r.* FROM "room" r
   WHERE r."hotelid" = $1
     AND r."status" = 'Available'
     AND r."roomid" NOT IN (
       SELECT br."roomid" FROM "booking_room" br
       JOIN "booking" b ON br."bookingid" = b."bookingid"
       WHERE b."status" NOT IN ('Cancelled')
         AND b."checkin" < $3
         AND b."checkout" > $2
     )
   ORDER BY r."price"`,
  [hotelId, checkIn, checkOut]
);
res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/hotels/:hotelId/rooms
export const createRoom = async (req, res) => {
  const { roomName, price, status = "Available" } = req.body;
  if (!roomName || !price) return res.status(400).json({ message: "RoomName and price required" });

  try {
    const pool = await getPool();

const result = await pool.query(
  `INSERT INTO room (hotelid, roomname, price, status)
   VALUES ($1,$2,$3,$4)
   RETURNING roomid`,
  [req.params.hotelId, roomName, price, status]
);

const newId = result.rows[0].roomid;



    res.status(201).json({ message: "Room created", roomId: newId });
  } catch (err) {
    console.error("Create error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/rooms/:id
export const updateRoom = async (req, res) => {
  const { roomName, price, status } = req.body;
  try {
    const pool = await getPool();
await pool.query(
  'UPDATE "room" SET "roomname"=$1, "price"=$2, "status"=$3 WHERE "roomid"=$4',
  [roomName, price, status, req.params.id]
);
    res.json({ message: "Room updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const pool = await getPool();
await pool.query('DELETE FROM "room" WHERE "roomid"=$1', [req.params.id]);
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};