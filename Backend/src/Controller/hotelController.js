import { getPool } from "../config/db.js";
import sql from "mssql";
import cloudinary from "cloudinary";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});












export const getAllHotels = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
  SELECT h.*,
    (SELECT "hotelpic" FROM "hotelpics" WHERE "hotelid" = h."hotelid" LIMIT 1) AS "mainimage"
  FROM "hotel" h
  ORDER BY h."hotelid"
`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/hotels/:id
export const getHotelById = async (req, res) => {
  try {
    const pool = await getPool();
    const hotel = await pool.query('SELECT * FROM "hotel" WHERE "hotelid" = $1', [req.params.id]);
    if (hotel.rows.length === 0) return res.status(404).json({ message: "Hotel not found" });

    const pics = await pool.query('SELECT * FROM "hotelpics" WHERE "hotelid" = $1', [req.params.id]);
    res.json({ ...hotel.rows[0], images: pics.rows });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/hotels
export const createHotel = async (req, res) => {
  const { name, location, checkinTime, checkoutTime, images = [] } = req.body;
  if (!name || !location) return res.status(400).json({ message: "Name and location required" });

  try {
    const pool = await getPool();
    // const newId = idRes.rows[0].NextID;



    const result = await pool.query(
  `INSERT INTO hotel(name, location, checkintime, checkouttime)
   VALUES($1,$2,$3,$4)
   RETURNING hotelid`,
  [name, location, checkinTime || "14:00", checkoutTime || "11:00"]
);

const newId = result.rows[0].hotelid;
  

    for (let i = 0; i < images.length; i++) {
      const picIdRes = await pool.query('SELECT COALESCE(MAX("hotelpicsid"),0)+1 AS "nextid" FROM "hotelpics"');
      await pool.query(
        'INSERT INTO "hotelpics" ("hotelpicsid","hotelid","hotelpic") VALUES ($1,$2,$3)',
        [picIdRes.rows[0].nextid, newId, images[i]]
      );
    }

    res.status(201).json({ message: "Hotel created", hotelId: newId });
  } catch (err) {
    console.error("Create error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/hotels/:id
export const updateHotel = async (req, res) => {
  const { name, location, checkinTime, checkoutTime } = req.body;
  try {
    const pool = await getPool();
    await pool.query(
      'UPDATE "hotel" SET "name"=$1, "location"=$2, "checkintime"=$3, "checkouttime"=$4 WHERE "hotelid"=$5',
      [name, location, checkinTime, checkoutTime, req.params.id]
    );
    res.json({ message: "Hotel updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/hotels/:id
export const deleteHotel = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query('DELETE FROM "hotel" WHERE "hotelid"=$1', [req.params.id]);
    await pool.query('DELETE FROM "hotelpics" WHERE "hotelid"=$1', [req.params.id]);
    res.json({ message: "Hotel deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: err.message });
  }
};












// POST /api/hotels/:hotelId/pictures
// Body: multipart/form-data  field name: "image"
export const uploadHotelPicture = async (req, res) => {
  const hotelId = req.params.hotelId;

  if (!req.file) return res.status(400).json({ message: "No image file provided" });

  try {
    // Upload buffer directly to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `rt-grace/hotels/${hotelId}`,
          transformation: [{ width: 1200, height: 800, crop: "fill", quality: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Save Cloudinary URL + public_id to DB
    const pool = await getPool();
    const idRes = await pool.query('SELECT COALESCE(MAX("hotelpicsid"),0)+1 AS "nextid" FROM "hotelpics"');
    const newId = idRes.rows[0].NextID;

    await pool.query(
      'INSERT INTO "hotelpics" ("hotelpicsid","hotelid","hotelpic") VALUES ($1,$2,$3)',
      [newId, hotelId, `${result.secure_url}|${result.public_id}`]
    );

    res.status(201).json({
      message: "Image uploaded",
      picId: newId,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// DELETE /api/hotels/pictures/:picId
export const deleteHotelPicture = async (req, res) => {
  const picId = req.params.picId;
  try {
    const pool = await getPool();

    // Get the pic record first to extract Cloudinary public_id
    const picRes = await pool.query('SELECT "hotelpic" FROM "hotelpics" WHERE "hotelpicsid" = $1', [picId]);
    if (picRes.rows.length === 0) return res.status(404).json({ message: "Picture not found" });

    const picValue = picRes.rows[0].HotelPic;
    // ... cloudinary destroy logic unchanged ...

    // Extract public_id if stored as "url|public_id"
    if (picValue && picValue.includes("|")) {
      const publicId = picValue.split("|")[1];
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete from DB
    await pool.query('DELETE FROM "hotelpics" WHERE "hotelpicsid" = $1', [picId]);

    res.json({ message: "Picture deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

// GET /api/hotels/:hotelId/pictures
export const getHotelPictures = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(
      'SELECT "hotelpicsid","hotelpic" FROM "hotelpics" WHERE "hotelid" = $1 ORDER BY "hotelpicsid"',
      [req.params.hotelId]
    );

    const pics = result.rows.map((p) => ({
      hotelpicsid: p.HotelPicsID,
      url: p.HotelPic?.includes("|") ? p.HotelPic.split("|")[0] : p.HotelPic,
    }));
    res.json(pics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};