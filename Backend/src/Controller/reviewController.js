import { getPool } from "../config/db.js";
// GET /api/hotels/:hotelId/reviews
export const getReviews = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(
  `SELECT r.*, u."name" AS "guestname",
    rr."responsetext", rr."responsedate", ru."name" AS "adminname"
   FROM "review" r
   JOIN "users" u ON r."userid" = u."userid"
   LEFT JOIN "review_response" rr ON r."reviewid" = rr."reviewid"
   LEFT JOIN "users" ru ON rr."adminid" = ru."userid"
   WHERE r."hotelid" = $1
   ORDER BY r."reviewdate" DESC`,
  [req.params.hotelId]
);
res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/hotels/:hotelId/reviews - Customer
export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user.userId;
  const hotelId = req.params.hotelId;

  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5" });

  try {
    const pool = await getPool();

    // Must have a completed booking
  const hasBooking = await pool.query(
  `SELECT "bookingid" FROM "booking" WHERE "userid"=$1 AND "hotelid"=$2 AND "status"='Completed'`,
  [userId, hotelId]
);
if (hasBooking.rows.length === 0) {
  return res.status(403).json({ message: "You can only review hotels you have stayed at" });
}

const idRes = await pool.query('SELECT COALESCE(MAX("reviewid"),0)+1 AS "nextid" FROM "review"');
await pool.query(
  'INSERT INTO "review" ("reviewid","userid","hotelid","rating","comment","reviewdate") VALUES ($1,$2,$3,$4,$5,$6)',
  [idRes.rows[0].NextID, userId, hotelId, rating, comment || "", new Date()]
);
    res.status(201).json({ message: "Review submitted" });
  } catch (err) {
  if (err.code === '23505') return res.status(409).json({ message: "You have already reviewed this hotel" });
  res.status(500).json({ message: err.message });
}
};

// POST /api/reviews/:id/respond - Admin
export const respondToReview = async (req, res) => {
  const { responseText } = req.body;
  const adminId = req.user.userId;

  try {
    const pool = await getPool();
   const idRes = await pool.query('SELECT COALESCE(MAX("responseid"),0)+1 AS "nextid" FROM "review_response"');
await pool.query(
  'INSERT INTO "review_response" ("responseid","reviewid","adminid","responsetext","responsedate") VALUES ($1,$2,$3,$4,$5)',
  [idRes.rows[0].NextID, req.params.id, adminId, responseText, new Date()]
);
    res.status(201).json({ message: "Response posted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews - Admin gets all reviews
export const getAllReviews = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
  SELECT r.*, u."name" AS "guestname", h."name" AS "hotelname",
    rr."responsetext", rr."responsedate"
  FROM "review" r
  JOIN "users" u ON r."userid" = u."userid"
  JOIN "hotel" h ON r."hotelid" = h."hotelid"
  LEFT JOIN "review_response" rr ON r."reviewid" = rr."reviewid"
  ORDER BY r."reviewdate" DESC
`);
res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};