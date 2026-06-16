"use client";
import { useEffect, useState } from "react";
import { getAllBookings, updateBookingStatus } from "../../../app/api";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Flag } from "lucide-react";

const STATUS_COLORS = {
  Confirmed: "bg-blue-50 text-blue-700 border-blue-100",
  Completed: "bg-green-50 text-green-700 border-green-100",
  Cancelled: "bg-red-50 text-red-700 border-red-100",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const fetch = () => {
    getAllBookings().then((r) => setBookings(r.data)).catch(() => toast.error("Failed to load bookings")).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      toast.success(`Booking ${status}`);
      fetch();
    } catch { toast.error("Update failed"); }
  };

  const FILTERS = ["All", "Confirmed", "Completed", "Cancelled"];
  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "All" || b.status === filter;
    const matchSearch = !search || b.guestname?.toLowerCase().includes(search.toLowerCase()) || b.hotelname?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-[3px] text-brand-600 uppercase mb-1">Management</p>
        <h1 className="font-playfair text-4xl font-normal">Bookings</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by guest or hotel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 w-64"
        />
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`font-jost text-xs px-4 py-2 rounded-lg border transition-colors ${filter === f ? "bg-brand-700 text-white border-brand-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center font-jost font-light text-neutral-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-jost">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  {["#", "Guest", "Contact", "Hotel", "Rooms", "Dates", "Total", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.bookingid} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 text-neutral-400 text-xs">#{b.bookingid}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{b.guestname}</td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      <div>{b.guestemail}</div>
                      <div>{b.guestphone}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{b.hotelname}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500 max-w-32 truncate">{b.rooms}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                      <div>{new Date(b.checkin).toLocaleDateString()}</div>
                      <div className="text-neutral-300">→ {new Date(b.checkout).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-700 whitespace-nowrap">${parseFloat(b.grandtotal).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs border rounded-full px-2.5 py-0.5 ${STATUS_COLORS[b.status] || "bg-neutral-50 text-neutral-600"}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {b.status === "Confirmed" && (
                          <>
                            <button onClick={() => updateStatus(b.bookingid, "Completed")} title="Mark Completed" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"><CheckCircle size={15} /></button>
                            <button onClick={() => updateStatus(b.bookingid, "Cancelled")} title="Cancel" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><XCircle size={15} /></button>
                          </>
                        )}
                        {b.status === "Completed" && (
                          <span className="text-xs text-neutral-300 font-light">Done</span>
                        )}
                        {b.status === "Cancelled" && (
                          <button onClick={() => updateStatus(b.bookingid, "Confirmed")} title="Restore" className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"><Flag size={15} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="py-16 text-center text-neutral-400 font-light">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}