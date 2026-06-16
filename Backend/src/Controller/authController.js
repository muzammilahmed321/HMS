import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


import { getPool } from "../config/db.js";

// await getPool(); // MUST be called before queries
// const pool = await sql.connect();

// const result = await pool.request().query("SELECT 1");


// POST /api/auth/signup
export const signup = async (req, res) => {
  const { name, email, phone, password, roleId = 2 } = req.body; // default role: Customer
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  try {
    const pool = await getPool();

    const existing = await pool.query(
      'SELECT "userid" FROM "users" WHERE "email" = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    
const result = await pool.query(
  `INSERT INTO "users" ("name", "email", "phone", "password", "roleid")
   VALUES ($1, $2, $3, $4, $5)
   RETURNING "userid"`,
  [name, email, phone || null, hashed, roleId]
);

const newId = result.rows[0].userid;
    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT u."userid", u."name", u."email", u."phone", u."password", r."roleid", r."rolename"
   FROM "users" u
   JOIN "role" r ON u."roleid" = r."roleid"
   WHERE u."email" = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.userid, name: user.name, email: user.email, roleName: user.rolename, roleId: user.roleid },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.userid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.rolename,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/auth/me
export const me = async (req, res) => {
  res.json({ user: req.user });
};