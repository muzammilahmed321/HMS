import { getPool } from "../config/db.js";

// GET /api/analytics/revenue
// Returns earned revenue for the last 5 months (non-cancelled bookings)
export const getRevenueByMonth = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.query(`
  SELECT
    EXTRACT(YEAR FROM bookingdate) AS yr,
    EXTRACT(MONTH FROM bookingdate) AS mo,
    SUM(grandtotal) AS revenue
  FROM booking
  WHERE status <> 'Cancelled'
    AND bookingdate >= date_trunc('month', CURRENT_DATE) - interval '4 months'
  GROUP BY
    EXTRACT(YEAR FROM bookingdate),
    EXTRACT(MONTH FROM bookingdate)
  ORDER BY yr, mo
`);

    // Build a guaranteed 5-slot array (current month + 4 before it)
    // so the chart always shows 5 bars even if some months have zero bookings
    const now = new Date();
    const months = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1; // JS months are 0-based

      const label = d.toLocaleString("en-GB", { month: "short", year: "numeric" });

      const row = result.rows.find(
        (r) => parseInt(r.yr) === yr && parseInt(r.mo) === mo
      );
      months.push({
        month: label,
        revenue: row ? parseFloat(row.revenue).toFixed(2) : "0.00",
      });
    }

    res.json(months);
  } catch (err) {
    console.error("Analytics revenue error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/bookings-status
// Returns booking status counts for the current calendar month (for pie chart)
export const getBookingStatusCurrentMonth = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.query(`
      SELECT
        status,
        COUNT(*) AS count
      FROM booking
      WHERE
        EXTRACT(YEAR FROM bookingdate) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM bookingdate) = EXTRACT(MONTH FROM CURRENT_DATE)
      GROUP BY status
    `);

    // Ensure all three statuses are always present (zero if no data)
    const statuses = ["Confirmed", "Completed", "Cancelled"];
    const data = statuses.map((status) => {
      const row = result.rows.find((r) => r.status === status);
      return { status, count: row ? parseInt(row.count) : 0 };
    });

    res.json(data);
  } catch (err) {
    console.error("Analytics bookings-status error:", err);
    res.status(500).json({ message: err.message });
  }
};