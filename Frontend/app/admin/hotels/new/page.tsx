"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createHotel, createRoom } from "../../../api";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Trash2, Bed, Hotel, MapPin, Clock, Loader2 } from "lucide-react";

const INPUT = "w-full border border-neutral-200 rounded-lg px-3 py-2.5 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white";
const LABEL = "block font-jost text-xs font-medium text-neutral-600 mb-1.5";

export default function NewHotelPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    location: "",
    checkinTime: "14:00",
    checkoutTime: "11:00",
  });

  // Rooms to add immediately after hotel creation
  const [rooms, setRooms] = useState([]);
  const [roomDraft, setRoomDraft] = useState({ roomName: "", price: "", status: "Available" });
  const [addingRoom, setAddingRoom] = useState(false);
  const [saving, setSaving] = useState(false);

  const addRoomToList = () => {
    if (!roomDraft.roomName || !roomDraft.price) return toast.error("Room name and price are required");
    setRooms([...rooms, { ...roomDraft, tempId: Date.now() }]);
    setRoomDraft({ roomName: "", price: "", status: "Available" });
    setAddingRoom(false);
  };

  const removeRoom = (tempId) => setRooms(rooms.filter((r) => r.tempId !== tempId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.location) return toast.error("Name and location are required");
    setSaving(true);
    try {
      const res = await createHotel(form);
      const hotelId = res.data.hotelid || res.data.hotelId;

      // Create any rooms that were added
      for (const room of rooms) {
        await createRoom(hotelId, {
          roomName: room.roomName,
          price: room.price,
          status: room.status,
        });
      }

      toast.success("Hotel created successfully");
      router.push("/admin/hotels");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create hotel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/hotels" className="p-2 rounded-lg border border-neutral-200 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-xs tracking-[3px] text-brand-600 uppercase mb-0.5">Management</p>
          <h1 className="font-playfair text-3xl font-normal">Add New Hotel</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left — Hotel details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic info card */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Hotel size={16} className="text-brand-600" />
                <h2 className="font-jost font-semibold text-sm text-neutral-700 uppercase tracking-wide">Property Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={LABEL}>Hotel Name *</label>
                  <input
                    required
                    className={INPUT}
                    placeholder="e.g. RT Grace Karachi"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className={LABEL}>Location *</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      required
                      className={`${INPUT} pl-8`}
                      placeholder="City, Country"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>
                    <span className="flex items-center gap-1.5"><Clock size={11} /> Check-in Time</span>
                  </label>
                  <input
                    type="time"
                    className={INPUT}
                    value={form.checkinTime}
                    onChange={(e) => setForm({ ...form, checkinTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className={LABEL}>
                    <span className="flex items-center gap-1.5"><Clock size={11} /> Check-out Time</span>
                  </label>
                  <input
                    type="time"
                    className={INPUT}
                    value={form.checkoutTime}
                    onChange={(e) => setForm({ ...form, checkoutTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Rooms card */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Bed size={16} className="text-brand-600" />
                  <h2 className="font-jost font-semibold text-sm text-neutral-700 uppercase tracking-wide">
                    Rooms <span className="text-neutral-400 font-normal">({rooms.length})</span>
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAddingRoom(true)}
                  className="flex items-center gap-1.5 text-xs font-jost font-medium text-brand-700 border border-brand-200 rounded-lg px-3 py-1.5 hover:bg-brand-50 transition-colors"
                >
                  <Plus size={12} /> Add Room
                </button>
              </div>

              {/* Room draft form */}
              {addingRoom && (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4 space-y-3">
                  <p className="font-jost text-xs font-medium text-brand-700">New Room</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className={LABEL}>Room Type</label>
                      <input
                        className={INPUT}
                        placeholder="Deluxe, Suite…"
                        value={roomDraft.roomName}
                        onChange={(e) => setRoomDraft({ ...roomDraft, roomName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Price / Night ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={INPUT}
                        placeholder="120.00"
                        value={roomDraft.price}
                        onChange={(e) => setRoomDraft({ ...roomDraft, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Status</label>
                      <select
                        className={INPUT}
                        value={roomDraft.status}
                        onChange={(e) => setRoomDraft({ ...roomDraft, status: e.target.value })}
                      >
                        <option>Available</option>
                        <option>Occupied</option>
                        <option>Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={addRoomToList} className="bg-brand-700 text-white text-xs font-jost font-medium px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors">
                      Add to List
                    </button>
                    <button type="button" onClick={() => setAddingRoom(false)} className="border border-neutral-200 text-xs font-jost px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Room list */}
              {rooms.length === 0 && !addingRoom ? (
                <div className="text-center py-8 text-neutral-300 border-2 border-dashed border-neutral-100 rounded-xl">
                  <Bed size={28} strokeWidth={1} className="mx-auto mb-2" />
                  <p className="font-jost text-xs">No rooms added yet</p>
                  <p className="font-jost text-xs text-neutral-300 mt-0.5">You can add rooms after creating the hotel too</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div key={room.tempId} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 group">
                      <div className="flex items-center gap-3">
                        <Bed size={14} className="text-neutral-300" />
                        <span className="font-jost font-medium text-sm">{room.roomName}</span>
                        <span className="font-jost text-xs text-neutral-400">${room.price}/night</span>
                        <span className={`text-xs border rounded-full px-2 py-0.5 ${
                          room.status === "Available" ? "bg-green-50 text-green-700 border-green-100" :
                          room.status === "Occupied" ? "bg-blue-50 text-blue-700 border-blue-100" :
                          "bg-orange-50 text-orange-700 border-orange-100"
                        }`}>{room.status}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRoom(room.tempId)}
                        className="p-1.5 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — notice + submit */}
          <div className="space-y-4">
            {/* Info note */}
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
              <h3 className="font-jost font-semibold text-sm text-brand-800 mb-2">After Creating</h3>
              <ul className="font-jost font-light text-xs text-brand-700 space-y-1.5 leading-relaxed">
                <li>📷 Upload hotel photos from the Hotels listing page</li>
                <li>🛏️ Add or edit rooms any time from the hotel card</li>
                <li>👥 Assign staff from the Departments page</li>
              </ul>
            </div>

            {/* Submit */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-brand-700 text-white font-jost font-medium py-3 rounded-xl hover:bg-brand-800 transition-colors disabled:opacity-60 text-sm tracking-wide"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Hotel size={16} />}
                {saving ? "Creating Hotel…" : "Create Hotel"}
              </button>
              <Link
                href="/admin/hotels"
                className="mt-3 w-full flex items-center justify-center font-jost font-light text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}