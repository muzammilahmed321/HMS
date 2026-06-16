// import sql from "mssql";

// const config = {
//   // OR try "localhost"
//   user: "Talha",
//   password: "14/08/2005.mts",
//   server: "DESKTOP-FPMJH3I",
//   database: "HotelManagementSystem",

//   port: 1433,
//   options: {
//     trustServerCertificate: true,
//     trustedConnection: false,
//     enableArithAbort: true,
//   },

// };

// let pool;

// export const getPool = async () => {

//   pool = await sql.connect(config);

//   console.log("✅ SQL Connected (SQL Auth)");

//   return pool;
// };

// export { sql };




import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // see note below
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL Connected (Supabase)");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PG pool error:", err);
});

export const getPool = async () => pool;