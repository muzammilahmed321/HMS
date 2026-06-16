"use client";
import { useEffect, useState } from "react";
import { getHotels, getAllBookings, getMaintenance } from "../api";
import { Building2, Calendar, Wrench, TrendingUp } from "lucide-react";
import API from "../api";

// ── Fetch analytics from backend ─────────────────────────────
const getRevenueByMonth = () => API.get("/analytics/revenue");
const getBookingStatus  = () => API.get("/analytics/bookings-status");

// ── Brand palette (matches project UI) ──────────────────────
const BRAND = {
  brown700: "#8b4513",
  brown600: "#a0522d",
  brown500: "#c4742a",
  brown400: "#d4863a",
  brown300: "#e8a86a",
  brown100: "#f9edda",
  brown50:  "#fdf8f0",
};

const STATUS_COLORS = {
  Confirmed: { fill: "#3b82f6", light: "#eff6ff", label: "Confirmed" },  // blue-500
  Completed: { fill: "#22c55e", light: "#f0fdf4", label: "Completed" },  // green-500
  Cancelled: { fill: "#ef4444", light: "#fef2f2", label: "Cancelled" },  // red-500
};

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <div className="font-playfair text-3xl text-neutral-800 mb-1">{value}</div>
      <div className="font-jost text-xs text-neutral-400 tracking-wide">{label}</div>
    </div>
  );
}

// ── Revenue Bar Chart (pure SVG, no library needed) ──────────
function RevenueBarChart({ data }) {
  if (!data || data.length === 0) return null;

  const W = 560;   // viewBox width
  const H = 220;   // viewBox height
  const PAD = { top: 20, right: 20, bottom: 48, left: 60 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  const maxRev = Math.max(...data.map((d) => parseFloat(d.revenue)), 1);
  // Round up to a clean ceiling
  const ceiling = Math.ceil(maxRev / 500) * 500 || 1000;

  const barW   = (chartW / data.length) * 0.55;
  const barGap = chartW / data.length;

  // Y-axis tick values
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(ceiling * f));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      style={{ overflow: "visible" }}
    >
      {/* Y grid lines + labels */}
      {ticks.map((tick) => {
        const y = PAD.top + chartH - (tick / ceiling) * chartH;
        return (
          <g key={tick}>
            <line
              x1={PAD.left} y1={y}
              x2={PAD.left + chartW} y2={y}
              stroke="#f0e8e0" strokeWidth="1"
            />
            <text
              x={PAD.left - 8} y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#a78a7a"
              fontFamily="Jost, sans-serif"
            >
              {tick >= 1000 ? `$${(tick / 1000).toFixed(1)}k` : `$${tick}`}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const rev = parseFloat(d.revenue);
        const barH = (rev / ceiling) * chartH;
        const x = PAD.left + i * barGap + (barGap - barW) / 2;
        const y = PAD.top + chartH - barH;

        // Gradient-like effect: current month slightly darker
        const isLast = i === data.length - 1;
        const fill = isLast ? BRAND.brown700 : BRAND.brown400;

        return (
          <g key={d.month}>
            {/* Bar */}
            <rect
              x={x} y={y}
              width={barW} height={Math.max(barH, 2)}
              rx="4" ry="4"
              fill={fill}
              opacity={isLast ? 1 : 0.75}
            />
            {/* Value label on top of bar */}
            {rev > 0 && (
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="9"
                fill={BRAND.brown700}
                fontFamily="Jost, sans-serif"
                fontWeight="600"
              >
                ${rev >= 1000 ? `${(rev / 1000).toFixed(1)}k` : rev.toFixed(0)}
              </text>
            )}
            {/* X-axis label */}
            <text
              x={x + barW / 2}
              y={PAD.top + chartH + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#9a7a6a"
              fontFamily="Jost, sans-serif"
            >
              {d.month}
            </text>
          </g>
        );
      })}

      {/* X axis line */}
      <line
        x1={PAD.left} y1={PAD.top + chartH}
        x2={PAD.left + chartW} y2={PAD.top + chartH}
        stroke="#e8d5c4" strokeWidth="1.5"
      />
      {/* Y axis line */}
      <line
        x1={PAD.left} y1={PAD.top}
        x2={PAD.left} y2={PAD.top + chartH}
        stroke="#e8d5c4" strokeWidth="1.5"
      />
    </svg>
  );
}

// ── Booking Status Pie Chart (pure SVG) ──────────────────────
function BookingPieChart({ data }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.count, 0);
  const cx = 100, cy = 100, r = 80;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
        <p className="font-jost font-light text-sm">No bookings this month</p>
      </div>
    );
  }

  // Build pie slices
  let cumAngle = -Math.PI / 2; // start at top
  const slices = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const angle = (d.count / total) * 2 * Math.PI;
      const startAngle = cumAngle;
      const endAngle   = cumAngle + angle;
      cumAngle = endAngle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArc = angle > Math.PI ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      // Label position (midpoint of arc)
      const midAngle = startAngle + angle / 2;
      const lx = cx + (r * 0.65) * Math.cos(midAngle);
      const ly = cy + (r * 0.65) * Math.sin(midAngle);

      const pct = Math.round((d.count / total) * 100);

      return { ...d, path, lx, ly, pct, angle };
    });

  return (
    <div className="flex items-center gap-6 flex-wrap justify-center">
      {/* Pie */}
      <svg viewBox="0 0 200 200" className="w-44 h-44 flex-shrink-0">
        {slices.map((s) => (
          <g key={s.status}>
            <path
              d={s.path}
              fill={STATUS_COLORS[s.status]?.fill || "#9ca3af"}
              stroke="#fff"
              strokeWidth="2"
            />
            {/* Show % inside slice only if big enough */}
            {s.pct >= 10 && (
              <text
                x={s.lx} y={s.ly + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#fff"
                fontFamily="Jost, sans-serif"
              >
                {s.pct}%
              </text>
            )}
          </g>
        ))}
        {/* Donut hole */}
        <circle cx={cx} cy={cy} r={r * 0.42} fill="#fff" />
        {/* Center label */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#2d1a0e" fontFamily="Playfair Display, serif">
          {total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9a7a6a" fontFamily="Jost, sans-serif">
          bookings
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-2.5">
        {data.map((d) => {
          const cfg = STATUS_COLORS[d.status] || { fill: "#9ca3af", label: d.status };
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.status} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cfg.fill }}
              />
              <div>
                <span className="font-jost text-sm text-neutral-700">{cfg.label}</span>
                <span className="font-jost text-xs text-neutral-400 ml-2">
                  {d.count} ({pct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats]               = useState({ hotels: 0, bookings: 0, maintenance: 0, revenue: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [revenueData,    setRevenueData]    = useState([]);
  const [statusData,     setStatusData]     = useState([]);
  const [chartsLoading,  setChartsLoading]  = useState(true);

  // Stat cards data
  useEffect(() => {
    Promise.all([getHotels(), getAllBookings(), getMaintenance()])
      .then(([h, b, m]) => {
        const revenue = b.data
          .filter((x) => x.status !== "Cancelled")
          .reduce((sum, x) => sum + parseFloat(x.grandtotal), 0);
        setStats({
          hotels: h.data.length,
          bookings: b.data.length,
          maintenance: m.data.filter((x) => x.status !== "Resolved").length,
          revenue,
        });
        setRecentBookings(b.data.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  // Chart data
  useEffect(() => {
    Promise.all([getRevenueByMonth(), getBookingStatus()])
      .then(([rev, bk]) => {
        setRevenueData(rev.data);
        setStatusData(bk.data);
      })
      .catch(() => {})
      .finally(() => setChartsLoading(false));
  }, []);

  const statCards = [
    { label: "Total Hotels",      value: stats.hotels,                    icon: Building2,  color: "bg-blue-50 text-blue-600"    },
    { label: "Total Bookings",    value: stats.bookings,                  icon: Calendar,   color: "bg-green-50 text-green-600"  },
    { label: "Open Maintenance",  value: stats.maintenance,               icon: Wrench,     color: "bg-orange-50 text-orange-600"},
    { label: "Total Revenue",     value: `$${stats.revenue.toFixed(0)}`,  icon: TrendingUp, color: "bg-brand-50 text-brand-600"  },
  ];

  const currentMonthLabel = new Date().toLocaleString("en-GB", { month: "long", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-[3px] text-brand-600 uppercase mb-1">Overview</p>
        <h1 className="font-playfair text-4xl font-normal">Dashboard</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-5 mb-8">

        {/* Revenue Bar Chart — takes 3/5 width */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-playfair text-xl font-normal">Revenue</h2>
              <p className="font-jost font-light text-xs text-neutral-400 mt-0.5">
                Last 5 months — confirmed & completed bookings
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 rounded-lg px-3 py-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: BRAND.brown700 }} />
              <span className="font-jost text-xs text-brand-700">Revenue ($)</span>
            </div>
          </div>

          {chartsLoading ? (
            <div className="h-52 flex items-center justify-center text-neutral-400">
              <span className="font-jost font-light text-sm">Loading chart...</span>
            </div>
          ) : (
            <RevenueBarChart data={revenueData} />
          )}
        </div>

        {/* Pie Chart — takes 2/5 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="font-playfair text-xl font-normal">Bookings</h2>
            <p className="font-jost font-light text-xs text-neutral-400 mt-0.5">
              {currentMonthLabel} — by status
            </p>
          </div>

          {chartsLoading ? (
            <div className="h-52 flex items-center justify-center text-neutral-400">
              <span className="font-jost font-light text-sm">Loading chart...</span>
            </div>
          ) : (
            <BookingPieChart data={statusData} />
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
        <h2 className="font-playfair text-xl mb-5">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-jost">
            <thead>
              <tr className="border-b border-neutral-100">
                {["ID", "Guest", "Hotel", "Check-in", "Check-out", "Total", "Status"].map((h) => (
                  <th key={h} className="text-left py-3 px-2 text-xs font-medium text-neutral-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.bookingid} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-2 text-neutral-400">#{b.bookingid}</td>
                  <td className="py-3 px-2 font-medium">{b.guestname}</td>
                  <td className="py-3 px-2 text-neutral-600">{b.hotelname}</td>
                  <td className="py-3 px-2 text-neutral-500">{new Date(b.checkin).toLocaleDateString()}</td>
                  <td className="py-3 px-2 text-neutral-500">{new Date(b.checkout).toLocaleDateString()}</td>
                  <td className="py-3 px-2 font-medium text-brand-700">${parseFloat(b.grandtotal).toFixed(2)}</td>
                  <td className="py-3 px-2">
                    <span className={`text-xs rounded-full px-2 py-0.5 border ${
                      b.status === "Confirmed" ? "bg-blue-50 text-blue-700 border-blue-100" :
                      b.status === "Completed" ? "bg-green-50 text-green-700 border-green-100" :
                      "bg-red-50 text-red-700 border-red-100"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-400 font-light">No bookings yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}