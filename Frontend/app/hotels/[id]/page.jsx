"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { getHotel, getAvailableRooms, createBooking } from "../../api";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";
import { MapPin, Clock, Users, Star, CheckCircle } from "lucide-react";


const formatTime = (t) => {
  if (!t) return "—";
  if (t.includes("T")) return t.substring(11, 16);
  return String(t).substring(0, 5);
};



export default function HotelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [form, setForm] = useState({ checkIn: "", checkOut: "", adults: 1, children: 0 });
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getHotel(id).then((r) => setHotel(r.data)).catch(() => {});
  }, [id]);

  const searchRooms = async () => {
    if (!form.checkIn || !form.checkOut) return toast.error("Please select check-in and check-out dates");
    if (new Date(form.checkOut) <= new Date(form.checkIn)) return toast.error("Check-out must be after check-in");
    setLoading(true);
    try {
      const res = await getAvailableRooms({ hotelId: id, checkIn: form.checkIn, checkOut: form.checkOut });
      setRooms(res.data);
      setSearched(true);
      setSelectedRooms([]);
      if (res.data.length === 0) toast("No rooms available for selected dates", { icon: "🏨" });
    } catch {
      toast.error("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  const toggleRoom = (roomId) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((r) => r !== roomId) : [...prev, roomId]
    );
  };

  const calcTotal = () => {
    if (!form.checkIn || !form.checkOut || selectedRooms.length === 0) return 0;
    const nights = Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000);
    const basePrice = selectedRooms.reduce((sum, rid) => {
      const r = rooms.find((x) => x.roomid === rid);
      return sum + (r ? parseFloat(r.price) : 0);
    }, 0);
    const extraAdults = Math.max(0, form.adults - 2);
    return ((basePrice * nights) + (extraAdults * 20 * nights)).toFixed(2);
  };

  const handleBook = async () => {
    if (!user) { toast.error("Please login to book"); return router.push("/auth/login"); }
    if (user.roleId !== 2) return toast.error("Only customers can book rooms");
    if (selectedRooms.length === 0) return toast.error("Please select at least one room");

    setBooking(true);
    try {
      const res = await createBooking({ hotelId: id, checkIn: form.checkIn, checkOut: form.checkOut, roomIds: selectedRooms, adults: form.adults, children: form.children });
      toast.success(`Booking confirmed! Total: $${res.data.grandTotal}`);
      router.push("/customer/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const nights = form.checkIn && form.checkOut ? Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000) : 0;

  if (!hotel) return (
    <main className="min-h-screen bg-white"><Navbar />
      <div className="pt-24 text-center py-20 font-jost font-light text-neutral-400">Loading...</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="relative h-80 mt-16 overflow-hidden">
        <img src={hotel.mainimage || "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&q=80"} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-8 left-8 text-white">
          <h1 className="font-playfair text-4xl font-normal mb-2">{hotel.name}</h1>
          <div className="flex items-center gap-4 font-jost font-light text-sm text-white/80">
            <span className="flex items-center gap-1"><MapPin size={14} />{hotel.location}</span>
            <span className="flex items-center gap-1"><Clock size={14} />Check-in: {formatTime(hotel.checkintime)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Booking Form */}
        <div className="bg-brand-700 rounded-2xl p-6 text-white mb-12">
          <h2 className="font-playfair text-2xl mb-5">Search Available Rooms</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Check-in", key: "checkIn", type: "date" },
              { label: "Check-out", key: "checkOut", type: "date" },
            ].map(({ label, key, type }) => (
              <div key={key} className="flex flex-col">
                <label className="font-jost text-xs text-brand-200 mb-1">{label}</label>
                <input
                  type={type}
                  min={key === "checkOut" ? form.checkIn : new Date().toISOString().split("T")[0]}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm font-jost focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            ))}
            <div className="flex flex-col">
              <label className="font-jost text-xs text-brand-200 mb-1">Adults</label>
              <select value={form.adults} onChange={(e) => setForm({ ...form, adults: +e.target.value })} className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm font-jost focus:outline-none">
                {[1,2,3,4,5,6].map((n) => <option key={n} value={n} className="text-black">{n}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-jost text-xs text-brand-200 mb-1">Children</label>
              <select value={form.children} onChange={(e) => setForm({ ...form, children: +e.target.value })} className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm font-jost focus:outline-none">
                {[0,1,2,3,4].map((n) => <option key={n} value={n} className="text-black">{n}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={searchRooms} disabled={loading} className="w-full bg-white text-brand-800 font-jost font-semibold py-2 rounded-lg hover:bg-brand-50 transition-colors text-sm disabled:opacity-60">
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>

        {/* Available Rooms */}
        {searched && (
          <div className="mb-10">
            <h2 className="font-playfair text-3xl mb-2">Available Rooms</h2>
            <p className="font-jost font-light text-neutral-500 mb-6 text-sm">
              {nights > 0 && `${nights} night${nights > 1 ? "s" : ""} · ${form.adults} adult${form.adults > 1 ? "s" : ""}${form.children > 0 ? ` · ${form.children} children` : ""}`}
              {form.adults > 2 && <span className="text-brand-600 ml-2">· +$20/night per extra adult</span>}
            </p>
            {rooms.length === 0 ? (
              <div className="text-center py-16 bg-neutral-50 rounded-2xl font-jost font-light text-neutral-400">No rooms available for these dates.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rooms.map((room) => {
                  const selected = selectedRooms.includes(room.roomid);
                  return (
                    <div key={room.roomid} onClick={() => toggleRoom(room.roomid)} className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${selected ? "border-brand-600 bg-brand-50" : "border-neutral-100 bg-white hover:border-brand-200 hover:shadow-sm"}`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-playfair text-lg">{room.roomname}</h3>
                        {selected && <CheckCircle size={18} className="text-brand-600 flex-shrink-0" />}
                      </div>
                      <div className="font-playfair text-2xl text-brand-700 mb-1">${room.price}<span className="font-jost font-light text-xs text-neutral-400">/night</span></div>
                      {nights > 0 && <p className="font-jost text-xs text-neutral-400">${(parseFloat(room.price) * nights).toFixed(2)} for {nights} nights</p>}
                      <span className="mt-3 inline-block text-xs font-jost bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5">Available</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Booking Summary */}
        {selectedRooms.length > 0 && (
          <div className="sticky bottom-6 bg-white border-2 border-brand-600 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-jost text-xs text-neutral-500 mb-1">{selectedRooms.length} room{selectedRooms.length > 1 ? "s" : ""} selected · {nights} nights</p>
                <div className="font-playfair text-3xl text-brand-700">${calcTotal()}<span className="font-jost font-light text-sm text-neutral-500"> total</span></div>
              </div>
              <button onClick={handleBook} disabled={booking} className="bg-brand-700 text-white font-jost font-semibold px-10 py-3 rounded-xl hover:bg-brand-800 transition-colors disabled:opacity-60 text-sm tracking-wide">
                {booking ? "Confirming..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}