import dotenv from "dotenv";
dotenv.config();

import { getPool } from "../config/db.js";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
                    resource_type: "image",
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

        const idRes = await pool.query(
            "SELECT COALESCE(MAX(hotelpicsid), 0) + 1 AS nextid FROM hotelpics"
        );
        const newId = idRes.rows[0].nextid;

        // Store full Cloudinary URL — public_id appended after | for deletion later
        const hotelPicValue = `${result.secure_url}|${result.public_id}`;

        await pool.query(
            "INSERT INTO hotelpics (hotelpicsid, hotelid, hotelpic) VALUES ($1, $2, $3)",
            [newId, hotelId, hotelPicValue]
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

    if (!picId || isNaN(Number(picId))) {
        return res.status(400).json({ message: "Valid picId is required" });
    }

    try {
        const pool = await getPool();

        const picRes = await pool.query(
            "SELECT hotelpic FROM hotelpics WHERE hotelpicsid = $1",
            [picId]
        );

        if (picRes.rows.length === 0) {
            return res.status(404).json({ message: "Picture not found" });
        }

        const picValue = picRes.rows[0].hotelpic;

        console.log("DB Value:", picValue);

        // DELETE FROM CLOUDINARY
        if (picValue && picValue.includes("|")) {

            const publicId = picValue.split("|")[1];

            console.log("Public ID:", publicId);

            try {
                const cloudinaryRes = await cloudinary.uploader.destroy(publicId);

                console.log("Cloudinary Response:", cloudinaryRes);

            } catch (cloudErr) {
                console.log("Cloudinary Delete Error:", cloudErr);
            }
        }

        // DELETE FROM DATABASE
        await pool.query(
            "DELETE FROM hotelpics WHERE hotelpicsid = $1",
            [picId]
        );

        res.json({ message: "Picture deleted successfully" });

    } catch (err) {

        console.error("Delete error:", err);

        res.status(500).json({
            message: "Delete failed",
            error: err.message
        });
    }
};

// GET /api/hotels/:hotelId/pictures
export const getHotelPictures = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.query(
            "SELECT hotelpicsid, hotelpic FROM hotelpics WHERE hotelid = $1 ORDER BY hotelpicsid",
            [req.params.hotelId]
        );

        // Parse url from "url|public_id" format
        const pics = result.rows.map((p) => ({
            hotelPicsId: p.hotelpicsid,
            url: p.hotelpic?.includes("|") ? p.hotelpic.split("|")[0] : p.hotelpic,
        }));

        res.json(pics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};