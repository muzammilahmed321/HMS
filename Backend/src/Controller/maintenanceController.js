import { getPool } from "../config/db.js";
// GET /api/maintenance
export const getAllMaintenance = async (req, res) => {
  try {
    const pool = await getPool();
  const result = await pool.query(`
  SELECT m.*, r."roomname", h."name" AS "hotelname", s."name" AS "staffname"
  FROM "maintenance" m
  JOIN "room" r ON m."roomid" = r."roomid"
  JOIN "hotel" h ON r."hotelid" = h."hotelid"
  LEFT JOIN "staff" s ON m."staffid" = s."staffid"
  ORDER BY m."maintenanceid" DESC
`);
res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/maintenance
export const createMaintenance = async (req, res) => {
  const { roomId, staffId, issue } = req.body;
  if (!roomId || !issue) return res.status(400).json({ message: "RoomID and issue required" });
  try {
    const pool = await getPool();
    const idRes = await pool.query('SELECT COALESCE(MAX("maintenanceid"),0)+1 AS "nextid" FROM "maintenance"');

await pool.query(
  'INSERT INTO "maintenance" ("maintenanceid","roomid","staffid","issue","status") VALUES ($1,$2,$3,$4,$5)',
  [idRes.rows[0].NextID, roomId, staffId || null, issue, "Pending"]
);

await pool.query(`UPDATE "room" SET "status"='Maintenance' WHERE "roomid"=$1`, [roomId]);
 
    res.status(201).json({ message: "Maintenance request created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/maintenance/:id
export const updateMaintenanceStatus = async (req, res) => {
  const { status, staffId } = req.body;
  const validStatuses = ["Pending", "In Progress", "Resolved"];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

  try {
    const pool = await getPool();
   await pool.query(
  'UPDATE "maintenance" SET "status"=$1, "staffid"=COALESCE($2, "staffid") WHERE "maintenanceid"=$3',
  [status, staffId || null, req.params.id]
);

if (status === "Resolved") {
  const m = await pool.query('SELECT "roomid" FROM "maintenance" WHERE "maintenanceid"=$1', [req.params.id]);
  if (m.rows.length > 0) {
    await pool.query(`UPDATE "room" SET "status"='Available' WHERE "roomid"=$1`, [m.rows[0].RoomID]);
  }
}

    res.json({ message: "Maintenance updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/maintenance/:id
export const deleteMaintenance = async (req, res) => {
  try {
    const pool = await getPool();
await pool.query('DELETE FROM "maintenance" WHERE "maintenanceid"=$1', [req.params.id]);
    res.json({ message: "Maintenance record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};