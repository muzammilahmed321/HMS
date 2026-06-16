"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getHotel, updateHotel,
  getRooms, createRoom, updateRoom, deleteRoom,
} from "../../../../api";
import toast from "react-hot-toast";
import {
  ArrowLeft, Save, Plus, Edit2, Trash2, Bed,
  Hotel, MapPin, Clock, Loader2, Check, X,
} from "lucide-react";

const INPUT = "w-full border border-neutral-200 rounded-lg px-3 py-2.5 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white";
const LABEL = "block font-jost text-xs font-medium text-neutral-600 mb-1.5";

// ── Inline editable room row ────────────────────────────────
function RoomRow({ room, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ roomName: room.roomname, price: room.price, status: room.status });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate(room.roomid, form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className={LABEL}>Room Type</label>
            <input className={INPUT} value={form.roomName} onChange={(e) => setForm({ ...form, roomName: e.target.value })} />
          </div>
          <div>
            <label className={LABEL}>Price / Night ($)</label>
            <input type="number" step="0.01" className={INPUT} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className={LABEL}>Status</label>
            <select className={INPUT} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Available</option><option>Occupied</option><option>Maintenance</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-brand-700 text-white text-xs font-jost font-medium px-3 py-1.5 rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60">
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 border border-neutral-200 text-xs font-jost px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors">
            <X size={11} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors group">
      <div className="flex items-center gap-3 flex-wrap">
        <Bed size={14} className="text-neutral-300 flex-shrink-0" />
        <span className="font-jost font-medium text-sm">{room.roomname}</span>
        <span className="font-jost text-xs text-neutral-400">${room.price}/night</span>
        <span className={`text-xs border rounded-full px-2 py-0.5 ${room.status === "Available" ? "bg-green-50 text-green-700 border-green-100" :
            room.status === "Occupied" ? "bg-blue-50 text-blue-700 border-blue-100" :
              "bg-orange-50 text-orange-700 border-orange-100"
          }`}>{room.status}</span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded text-neutral-400 hover:text-brand-700 hover:bg-brand-50 transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={() => onDelete(room.roomid, room.roomname)} className="p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Main edit page ──────────────────────────────────────────
export default function EditHotelPage() {
  const { id } = useParams();
  const router = useRouter();

  const [hotel, setHotel] = useState(null);
  const [form, setForm] = useState({ name: "", location: "", checkinTime: "", checkoutTime: "" });
  const [rooms, setRooms] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingRoom, setAddingRoom] = useState(false);
  const [roomDraft, setRoomDraft] = useState({ roomName: "", price: "", status: "Available" });

  // fix ISO time → "HH:MM"
  const parseTime = (t) => {
    if (!t) return "";
    if (t.includes("T")) return t.substring(11, 16);
    return String(t).substring(0, 5);
  };

  useEffect(() => {
    Promise.all([getHotel(id), getRooms(id)])
      .then(([hotelRes, roomsRes]) => {
        const h = hotelRes.data;
        setHotel(h);
        setForm({
          name: h.name,
          location: h.location,
          checkinTime: parseTime(h.checkintime),
          checkoutTime: parseTime(h.checkouttime),
        });
        setRooms(roomsRes.data);
        console.log(roomsRes.data);
      })
      .catch(() => toast.error("Failed to load hotel data"))
      .finally(() => setPageLoading(false));
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateHotel(id, form);
      toast.success("Hotel updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRoom = async () => {
    if (!roomDraft.roomName || !roomDraft.price) return toast.error("Room name and price required");
    try {
      await createRoom(id, roomDraft);
      toast.success("Room added");
      const res = await getRooms(id);
      setRooms(res.data);
      setRoomDraft({ roomName: "", price: "", status: "Available" });
      setAddingRoom(false);
    } catch { toast.error("Failed to add room"); }
  };

  const handleUpdateRoom = async (roomId, data) => {
    try {
      await updateRoom(roomId, data);
      toast.success("Room updated");
      const res = await getRooms(id);
      setRooms(res.data);
    } catch { toast.error("Failed to update room"); }
  };

  const handleDeleteRoom = async (roomid, roomName) => {
    if (!confirm(`Delete room "${roomName}"?`)) return;
    try {
      await deleteRoom(roomid);
      toast.success("Room deleted");
      setRooms(rooms.filter((r) => r.roomid !== roomid));
    } catch { toast.error("Failed to delete room"); }
  };

  if (pageLoading) return (
    <div className="flex items-center justify-center py-24 gap-3 text-neutral-400">
      <Loader2 size={22} className="animate-spin text-brand-400" />
      <span className="font-jost font-light text-sm">Loading hotel…</span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/hotels" className="p-2 rounded-lg border border-neutral-200 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-xs tracking-[3px] text-brand-600 uppercase mb-0.5">Management</p>
          <h1 className="font-playfair text-3xl font-normal">Edit — {hotel?.name}</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-6 gap-6">
        {/* Left — Details form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Hotel info */}
          <form onSubmit={handleSave}>
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-3">
              <div className="flex items-center gap-2 mb-5">
                <Hotel size={16} className="text-brand-600" />
                <h2 className="font-jost font-semibold text-sm text-neutral-700 uppercase tracking-wide">Property Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={LABEL}>Hotel Name</label>
                  <input required className={INPUT} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>Location</label>

                  <div className="relative">
                    {form.location.length === 0 && (
                      <MapPin
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                      />
                    )}

                    <input
                      required
                      className={`${INPUT} w-full pl-10`}
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL}><span className="flex items-center gap-1"><Clock size={11} /> Check-in Time</span></label>
                  <input type="time" className={INPUT} value={form.checkinTime} onChange={(e) => setForm({ ...form, checkinTime: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL}><span className="flex items-center gap-1"><Clock size={11} /> Check-out Time</span></label>
                  <input type="time" className={INPUT} value={form.checkoutTime} onChange={(e) => setForm({ ...form, checkoutTime: e.target.value })} />
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-50">
                <button type="submit" disabled={saving} className="flex items-center gap-2 bg-brand-700 text-white font-jost font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-brand-800 transition-colors disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </form>

          {/* Rooms section */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Bed size={16} className="text-brand-600" />
                <h2 className="font-jost font-semibold text-sm text-neutral-700 uppercase tracking-wide">
                  Rooms <span className="text-neutral-400 font-normal normal-case">({rooms.length})</span>
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

            {/* New room draft */}
            {addingRoom && (
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4 space-y-3">
                <p className="font-jost text-xs font-medium text-brand-700">New Room</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL}>Room Type</label>
                    <input className={INPUT} placeholder="Deluxe, Suite…" value={roomDraft.roomName} onChange={(e) => setRoomDraft({ ...roomDraft, roomName: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Price / Night ($)</label>
                    <input type="number" step="0.01" className={INPUT} placeholder="120.00" value={roomDraft.price} onChange={(e) => setRoomDraft({ ...roomDraft, price: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Status</label>
                    <select className={INPUT} value={roomDraft.status} onChange={(e) => setRoomDraft({ ...roomDraft, status: e.target.value })}>
                      <option>Available</option><option>Occupied</option><option>Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddRoom} className="bg-brand-700 text-white text-xs font-jost font-medium px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors flex items-center gap-1.5">
                    <Plus size={12} /> Add Room
                  </button>
                  <button type="button" onClick={() => setAddingRoom(false)} className="border border-neutral-200 text-xs font-jost px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Room list */}
            {rooms.length === 0 && !addingRoom ? (
              <div className="text-center py-8 border-2 border-dashed border-neutral-100 rounded-xl text-neutral-300">
                <Bed size={28} strokeWidth={1} className="mx-auto mb-2" />
                <p className="font-jost text-xs">No rooms added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <RoomRow
                    key={room.roomid}
                    room={room}
                    onUpdate={handleUpdateRoom}
                    onDelete={handleDeleteRoom}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — side info */}
        <div>
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
            <h3 className="font-jost font-semibold text-sm text-brand-800 mb-3">Tips</h3>
            <ul className="font-jost font-light text-xs text-brand-700 space-y-2 leading-relaxed">
              <li>📷 Manage hotel photos from the Hotels listing page — click any hotel card's photo area</li>
              <li>🛏️ Room status changes affect booking availability in real time</li>
              <li>⚠️ Deleting a room with active bookings is blocked by the system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}