"use client";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../app/AuthContext";
import { getMyBookings, createReview } from "../../../app/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Calendar, MapPin, CheckCircle, XCircle, Clock, Star } from "lucide-react";

const StatusBadge = ({ status }) => {
  const map = {
    Confirmed: "bg-blue-50 text-blue-700 border-blue-100",
    Completed: "bg-green-50 text-green-700 border-green-100",
    Cancelled: "bg-red-50 text-red-700 border-red-100",
  };
  return <span className={`text-xs font-jost border rounded-full px-2.5 py-0.5 ${map[status] || "bg-neutral-50 text-neutral-600"}`}>{status}</span>;
};

function ReviewModal({ booking, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await createReview(booking.hotelid, { rating, comment });
      toast.success("Review submitted!");
      onSubmit();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="font-playfair text-2xl mb-1">Leave a Review</h3>
        <p className="font-jost font-light text-neutral-500 text-sm mb-5">{booking.hotelname}</p>

        <div className="flex gap-2 mb-5">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star size={28} className={n <= rating ? "text-yellow-400 fill-yellow-400" : "text-neutral-200"} />
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-neutral-200 font-jost font-medium py-2.5 rounded-lg text-sm hover:bg-neutral-50">Cancel</button>
          <button onClick={submit} disabled={loading} className="flex-1 bg-brand-700 text-white font-jost font-medium py-2.5 rounded-lg text-sm hover:bg-brand-800 disabled:opacity-60">
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && user?.role !== "Customer") router.push("/admin");
  }, [user, authLoading]);

  const fetchBookings = () => {
    getMyBookings()
      .then((r) => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) fetchBookings(); }, [user]);

  if (authLoading || loading) return (
    <main className="min-h-screen bg-white"><Navbar />
      <div className="pt-24 text-center py-20 font-jost font-light text-neutral-400">Loading...</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-xs tracking-[4px] text-brand-600 uppercase mb-2">My Account</p>
          <h1 className="font-playfair text-4xl font-normal">Welcome, {user?.name}</h1>
          <p className="font-jost font-light text-neutral-500 mt-1">Manage your bookings and reviews</p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100">
            <div className="font-playfair text-2xl text-neutral-300 mb-3">No bookings yet</div>
            <p className="font-jost font-light text-neutral-400 text-sm mb-6">Explore our hotels and book your first stay</p>
            <button onClick={() => router.push("/hotels")} className="bg-brand-700 text-white font-jost font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-brand-800">
              Explore Hotels
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.bookingid} className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-playfair text-xl">{b.hotelname}</h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex flex-wrap gap-4 font-jost font-light text-xs text-neutral-500 mb-3">
                      <span className="flex items-center gap-1"><MapPin size={12} />{b.location}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} />{new Date(b.checkin).toLocaleDateString()} – {new Date(b.checkout).toLocaleDateString()}</span>
                      <br /><span>Rooms: {b.rooms}</span>
                    </div>
                    <div className="font-playfair text-2xl text-brand-700">
                      ${parseFloat(b.grandtotal).toFixed(2)}
                    </div>  
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className="font-jost text-xs text-neutral-400">Booking #{b.bookingid}</span>
                    <span className="font-jost text-xs text-neutral-400">{new Date(b.bookingdate).toLocaleDateString()}</span>
                    {b.status === "Completed" && (
                      <button onClick={() => setReviewBooking(b)} className="text-xs font-jost font-medium text-brand-700 border border-brand-200 rounded-full px-3 py-1 hover:bg-brand-50 transition-colors flex items-center gap-1">
                        <Star size={12} /> Leave Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewBooking && (
        <ReviewModal booking={reviewBooking} onClose={() => setReviewBooking(null)} onSubmit={fetchBookings} />
      )}
    </main>
  );
}