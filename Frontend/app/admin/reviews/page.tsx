"use client";
import { useEffect, useState } from "react";
import { getAllReviews, respondToReview } from "../../api";
import toast from "react-hot-toast";
import {
  Star,
  MessageSquare,
  MessageSquareReply,
  Filter,
  Hotel,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

// Inline style approach — bypasses Tailwind purging of SVG fill utilities.
// Tailwind's fill-* classes are often purged at build time for SVG elements,
// causing stars to appear outlined. style prop always works.
const STAR_FILLED  = { color: "#fbbf24", fill: "#fbbf24" };                       // amber-400 yellow
const STAR_EMPTY   = { color: "#d1d5db", fill: "none", stroke: "#d1d5db" };       // neutral-300 grey outline

function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          style={n <= rating ? STAR_FILLED : STAR_EMPTY}
        />
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="font-jost text-xs text-neutral-500 w-3">{star}</span>
      <Star size={10} style={STAR_FILLED} className="flex-shrink-0" />
      <div className="flex-1 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-jost text-xs text-neutral-400 w-6 text-right">{count}</span>
    </div>
  );
}

function ReplyPanel({ review, onReplied }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  if (review.responsetext) {
    return (
      <div className="mt-4 bg-brand-50 border border-brand-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquareReply size={13} className="text-brand-600" />
          <span className="font-jost text-xs font-medium text-brand-700">Management Response</span>
          {review.responsedate && (
            <span className="font-jost text-xs text-neutral-400 ml-auto">
              {new Date(review.responsedate).toLocaleDateString()}
            </span>
          )}
        </div>
        <p className="font-jost font-light text-sm text-neutral-600 leading-relaxed">
          {review.responsetext}
        </p>
        <p className="font-jost text-xs text-neutral-400 mt-2">— {review.adminname || "Admin"}</p>
      </div>
    );
  }

  const submit = async () => {
    if (!text.trim()) return toast.error("Reply cannot be empty");
    setSaving(true);
    try {
      await respondToReview(review.reviewid, { responseText: text.trim() });
      toast.success("Response posted");
      setOpen(false);
      setText("");
      onReplied();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post response");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-jost font-medium text-brand-700 hover:text-brand-800 transition-colors"
        >
          <MessageSquareReply size={13} /> Reply to this review
        </button>
      ) : (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-jost text-xs font-medium text-brand-700 flex items-center gap-1.5">
              <MessageSquareReply size={13} /> Write a Response
            </span>
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600">
              <X size={14} />
            </button>
          </div>
          <textarea
            rows={3}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Thank the guest or address their feedback professionally..."
            className="w-full border border-brand-200 rounded-lg px-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={saving}
              className="flex items-center gap-1.5 bg-brand-700 text-white text-xs font-jost font-medium px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {saving ? "Posting..." : "Post Response"}
            </button>
            <button
              onClick={() => { setOpen(false); setText(""); }}
              className="text-xs border border-neutral-200 font-jost px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, onReplied }) {
  const [expanded, setExpanded] = useState(false);
  const hasLongComment = review.comment?.length > 220;
  const displayComment = hasLongComment && !expanded
    ? review.comment.slice(0, 220) + "..."
    : review.comment;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-playfair text-base font-semibold flex-shrink-0">
            {review.guestname?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="font-jost font-semibold text-sm text-neutral-800">{review.guestname}</div>
            <div className="font-jost text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
              <Hotel size={10} />
              {review.hotelname}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* StarRow uses inline styles — always renders correctly */}
          <StarRow rating={review.Rating} size={15} />
          <span className="font-jost text-xs text-neutral-400">
            {new Date(review.reviewdate).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="border-t border-neutral-50 my-4" />

      {review.Comment ? (
        <div>
          <p className="font-jost font-light text-sm text-neutral-600 leading-relaxed">
            {displayComment}
          </p>
          {hasLongComment && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-brand-600 font-jost font-medium flex items-center gap-0.5 hover:text-brand-700"
            >
              {expanded
                ? <><ChevronUp size={11} /> Show less</>
                : <><ChevronDown size={11} /> Read more</>}
            </button>
          )}
        </div>
      ) : (
        <p className="font-jost font-light text-xs text-neutral-300 italic">No written comment</p>
      )}

      <ReplyPanel review={review} onReplied={onReplied} />
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState(0);
  const [filterHotel, setFilterHotel] = useState("All");
  const [filterReplied, setFilterReplied] = useState("All");
  const [search, setSearch] = useState("");

  const fetchAll = () => {
    getAllReviews()
      .then((r) => setReviews(r.data))
      .catch(() => toast.error("Failed to load reviews"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const repliedCount = reviews.filter((r) => !!r.responsetext).length;
  const pendingCount = reviews.length - repliedCount;
  const responseRate = reviews.length
    ? Math.round((repliedCount / reviews.length) * 100)
    : 0;

  const hotelNames = [...new Set(reviews.map((r) => r.hotelname).filter(Boolean))];

  const filtered = reviews.filter((r) => {
    const matchRating = filterRating === 0 || r.rating === filterRating;
    const matchHotel = filterHotel === "All" || r.hotelname === filterHotel;
    const matchReplied =
      filterReplied === "All" ||
      (filterReplied === "Replied" && !!r.responsetext) ||
      (filterReplied === "Pending" && !r.responsetext);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.guestname?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q) ||
      r.hotelname?.toLowerCase().includes(q);
    return matchRating && matchHotel && matchReplied && matchSearch;
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-[3px] text-brand-600 uppercase mb-1">Guest Feedback</p>
        <h1 className="font-playfair text-4xl font-normal">Reviews</h1>
        <p className="font-jost font-light text-neutral-400 text-sm mt-1">
          Monitor guest satisfaction and respond to feedback
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid lg:grid-cols-3 gap-5 mb-8">

        <div className="bg-brand-700 rounded-2xl p-6 text-white">
          <p className="font-jost text-xs text-brand-300 uppercase tracking-wider mb-3">Overall Rating</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="font-playfair text-6xl font-normal leading-none">
              {reviews.length ? avgRating : "—"}
            </span>
            <div className="mb-1">
              {/* StarRow with inline styles works on dark background too */}
              <StarRow rating={Math.round(parseFloat(avgRating) || 0)} size={16} />
              <p className="font-jost font-light text-brand-300 text-xs mt-1">
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <p className="font-jost text-xs text-neutral-400 uppercase tracking-wider mb-4">Rating Breakdown</p>
          <div className="space-y-2.5">
            {ratingCounts.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={reviews.length} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <p className="font-jost text-xs text-neutral-400 uppercase tracking-wider mb-4">Response Status</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="font-jost text-sm text-neutral-600">Replied</span>
              </div>
              <span className="font-jost font-semibold text-sm text-neutral-800">{repliedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="font-jost text-sm text-neutral-600">Awaiting Reply</span>
              </div>
              <span className="font-jost font-semibold text-sm text-neutral-800">{pendingCount}</span>
            </div>
            <div className="pt-1">
              <div className="bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-700"
                  style={{ width: `${responseRate}%` }}
                />
              </div>
              <p className="font-jost text-xs text-neutral-400 mt-1.5">{responseRate}% response rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">

        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search guest, comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-neutral-200 rounded-lg pl-8 pr-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 w-52"
          />
        </div>

        {/* Star filter buttons in brand color */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterRating(0)}
            className={`font-jost text-xs px-3 py-2 rounded-lg border transition-colors ${
              filterRating === 0
                ? "bg-brand-700 text-white border-brand-700"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            All Stars
          </button>
          {[5, 4, 3, 2, 1].map((n) => (
            <button
              key={n}
              onClick={() => setFilterRating(filterRating === n ? 0 : n)}
              className={`font-jost text-xs px-2.5 py-2 rounded-lg border transition-colors flex items-center gap-1 ${
                filterRating === n
                  ? "bg-brand-700 text-white border-brand-700"
                  : "border-brand-200 text-brand-700 hover:bg-brand-50"
              }`}
            >
              {n}
              <Star
                size={10}
                style={filterRating === n
                  ? { color: "#ffffff", fill: "#ffffff" }
                  : { color: "#8b4513", fill: "#8b4513" }
                }
              />
            </button>
          ))}
        </div>

        {hotelNames.length > 1 && (
          <select
            className="border border-neutral-200 rounded-lg px-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 text-neutral-600"
            value={filterHotel}
            onChange={(e) => setFilterHotel(e.target.value)}
          >
            <option value="All">All Hotels</option>
            {hotelNames.map((h) => <option key={h}>{h}</option>)}
          </select>
        )}

        <div className="flex gap-1.5">
          {["All", "Replied", "Pending"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterReplied(f)}
              className={`font-jost text-xs px-3 py-2 rounded-lg border transition-colors ${
                filterReplied === f
                  ? "bg-brand-700 text-white border-brand-700"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {f === "Pending" ? "Awaiting Reply" : f}
            </button>
          ))}
        </div>
      </div>

      <p className="font-jost text-xs text-neutral-400 mb-5">
        Showing {filtered.length} of {reviews.length} review{reviews.length !== 1 ? "s" : ""}
      </p>

      {/* One card per row */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3 text-neutral-400">
          <Loader2 size={22} className="animate-spin text-brand-400" />
          <span className="font-jost font-light text-sm">Loading reviews...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-neutral-100">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={22} className="text-neutral-300" />
          </div>
          <p className="font-playfair text-xl text-neutral-300 mb-1">No reviews found</p>
          <p className="font-jost font-light text-neutral-400 text-sm">
            {search || filterRating || filterReplied !== "All"
              ? "Try adjusting your filters"
              : "Guest reviews will appear here after completed stays"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((review) => (
            <ReviewCard key={review.reviewid} review={review} onReplied={fetchAll} />
          ))}
        </div>
      )}
    </div>
  );
}