import app from "./app.js";
import dotenv from "dotenv";
import { pool } from "./config/db.js"; // apne path ke mutabiq


dotenv.config();

const PORT = process.env.PORT || 3000;

console.log("DATABASE_URL =", process.env.DATABASE_URL);
try {
  const result = await pool.query("SELECT NOW()");
  console.log("DB Connected:", result.rows);
} catch (err) {
  console.error("DB TEST ERROR:", err);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});