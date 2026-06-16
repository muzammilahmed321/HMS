import { getPool } from "../config/db.js";

// ─── DEPARTMENT ───────────────────────────────────────────────

export const getDepartments = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query('SELECT * FROM "department" ORDER BY "deptid"');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createDepartment = async (req, res) => {
  const { deptName } = req.body;
  if (!deptName) return res.status(400).json({ message: "Department name required" });
  try {
    const pool = await getPool();
    const idRes = await pool.query('SELECT COALESCE(MAX("deptid"),0)+1 AS "NextID" FROM "department"');
    await pool.query(
      'INSERT INTO "department" ("deptid","deptname") VALUES ($1,$2)',
      [idRes.rows[0].NextID, deptName]
    );
    res.status(201).json({ message: "Department created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDepartment = async (req, res) => {
  const { deptName } = req.body;
  try {
    const pool = await getPool();
    await pool.query('UPDATE "department" SET "deptname"=$1 WHERE "deptid"=$2', [deptName, req.params.id]);
    res.json({ message: "Department updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query('DELETE FROM "department" WHERE "deptid"=$1', [req.params.id]);
    res.json({ message: "Department deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── STAFF ───────────────────────────────────────────────────

export const getStaffByHotel = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT s.*, d."deptname" FROM "staff" s
       LEFT JOIN "department" d ON s."deptid" = d."deptid"
       WHERE s."hotelid" = $1
       ORDER BY s."staffid"`,
      [req.params.hotelId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createStaff = async (req, res) => {
  const { name, role, deptId } = req.body;
  if (!name || !role) return res.status(400).json({ message: "Name and role required" });
  try {
    const pool = await getPool();
    const idRes = await pool.query('SELECT COALESCE(MAX("staffid"),0)+1 AS "NextID" FROM "staff"');
    await pool.query(
      'INSERT INTO "staff" ("staffid","hotelid","name","role","deptid") VALUES ($1,$2,$3,$4,$5)',
      [idRes.rows[0].NextID, req.params.hotelId, name, role, deptId || null]
    );
    res.status(201).json({ message: "Staff added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateStaff = async (req, res) => {
  const { name, role, deptId } = req.body;
  try {
    const pool = await getPool();
    await pool.query(
      'UPDATE "staff" SET "name"=$1, "role"=$2, "deptid"=$3 WHERE "staffid"=$4',
      [name, role, deptId || null, req.params.id]
    );
    res.json({ message: "Staff updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query('DELETE FROM "staff" WHERE "staffid"=$1', [req.params.id]);
    res.json({ message: "Staff deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};