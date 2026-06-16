"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  getMaintenance, createMaintenance, updateMaintenance,
  deleteMaintenance, getHotels, getRooms, getStaff,
} from "../../api";
import toast from "react-hot-toast";
import {
  Plus, Wrench, Trash2, ChevronDown,
  AlertTriangle, CheckCircle2, Loader2,
  X, Hotel, Bed, User, Filter,
} from "lucide-react";

const INPUT = "w-full border border-neutral-200 rounded-lg px-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white";
const BTN_PRIMARY = "bg-brand-700 text-white font-jost font-medium px-4 py-2 rounded-lg text-sm hover:bg-brand-800 transition-colors flex items-center gap-2 disabled:opacity-50";

const STATUS_CFG = {
  "Pending":     { pill: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400",  label: "Pending"     },
  "In Progress": { pill: "bg-blue-50 text-blue-700 border-blue-200",   dot: "bg-blue-400",   label: "In Progress" },
  "Resolved":    { pill: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-400",  label: "Resolved"    },
};

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="font-playfair text-3xl text-neutral-800 mb-0.5">{value}</div>
      <div className="font-jost text-xs text-neutral-400 tracking-wide">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-0.5 font-jost ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── New Maintenance Modal ─────────────────────────────────────
function NewRequestModal({ onClose, onCreated }) {
  const [hotels, setHotels] = useState([]);
  const [rooms,  setRooms]  = useState([]);
  const [staff,  setStaff]  = useState([]);
  const [form,   setForm]   = useState({ hotelId: "", roomId: "", staffId: "", issue: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { getHotels().then((r) => setHotels(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (form.hotelId) {
      getRooms(form.hotelId).then((r) => setRooms(r.data)).catch(() => {});
      getStaff(form.hotelId).then((r) => setStaff(r.data)).catch(() => {});
      setForm((p) => ({ ...p, roomId: "", staffId: "" }));
    }
  }, [form.hotelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roomId || !form.issue.trim()) return toast.error("Room and issue description are required");
    setSaving(true);
    try {
      await createMaintenance({ roomId: form.roomId, staffId: form.staffId || null, issue: form.issue.trim() });
      toast.success("Maintenance request created");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-neutral-100">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
          <div>
            <h2 className="font-playfair text-2xl font-normal">New Maintenance Request</h2>
            <p className="font-jost font-light text-neutral-400 text-xs mt-0.5">Raise an issue for a specific room</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 font-jost text-xs font-medium text-neutral-600 mb-1.5"><Hotel size={12} /> Property</label>
            <select required className={INPUT} value={form.hotelId} onChange={(e) => setForm({ ...form, hotelId: e.target.value })}>
              <option value="">Select hotel…</option>
              {hotels.map((h) => <option key={h.hotelid} value={h.hotelid}>{h.name} — {h.location}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 font-jost text-xs font-medium text-neutral-600 mb-1.5"><Bed size={12} /> Room</label>
            <select required className={INPUT} value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} disabled={!form.hotelId}>
              <option value="">Select room…</option>
              {rooms.map((r) => <option key={r.roomid} value={r.roomid}>{r.roomname} — ${r.price}/night ({r.status})</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 font-jost text-xs font-medium text-neutral-600 mb-1.5">
              <User size={12} /> Assign Staff <span className="text-neutral-400 font-light">(optional)</span>
            </label>
            <select className={INPUT} value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} disabled={!form.hotelId}>
              <option value="">Unassigned</option>
              {staff.map((s) => <option key={s.staffid} value={s.staffid}>{s.name} — {s.role}</option>)}
            </select>
          </div>
          <div>
            <label className="font-jost text-xs font-medium text-neutral-600 mb-1.5 block">Issue Description</label>
            <textarea required rows={3} className={`${INPUT} resize-none`}
              placeholder="Describe the issue e.g. AC not cooling, bathroom tap leaking…"
              value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className={BTN_PRIMARY}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Creating…" : "Create Request"}
            </button>
            <button type="button" onClick={onClose} className="border border-neutral-200 font-jost font-medium px-4 py-2 rounded-lg text-sm hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Portal popup — mounts on document.body, sits above everything ──
function UpdatePopup({ staff, saving, formState, onChange, onSave, onClose, anchorRef }) {
  const popupRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Calculate position relative to the trigger button
  useEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const POPUP_H = 268;
    const POPUP_W = 264;
    const spaceBelow = window.innerHeight - rect.bottom;

    const top = spaceBelow >= POPUP_H
      ? rect.bottom + window.scrollY + 6
      : rect.top  + window.scrollY - POPUP_H - 6;

    const rawLeft = rect.left + window.scrollX;
    const left = Math.min(rawLeft, window.innerWidth + window.scrollX - POPUP_W - 16);

    setPos({ top, left });
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    const tid = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(tid); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      ref={popupRef}
      style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999, width: 264 }}
      className="bg-white rounded-xl border border-neutral-200 shadow-2xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="font-jost text-xs font-semibold text-neutral-500 uppercase tracking-wider">Update Request</p>
        <button onClick={onClose} className="p-1 rounded text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
          <X size={13} />
        </button>
      </div>

      <div>
        <label className="font-jost text-xs text-neutral-500 mb-1 block">Status</label>
        <select className={INPUT} value={formState.status} onChange={(e) => onChange({ ...formState, status: e.target.value })}>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>
      </div>

      <div>
        <label className="font-jost text-xs text-neutral-500 mb-1 block">Reassign Staff</label>
        <select className={INPUT} value={formState.staffId} onChange={(e) => onChange({ ...formState, staffId: e.target.value })}>
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.staffid} value={s.staffid}>{s.name} — {s.role}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving}
          className="flex-1 bg-brand-700 text-white text-xs font-jost font-medium py-2 rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onClose}
          className="flex-1 border border-neutral-200 text-xs font-jost py-2 rounded-lg hover:bg-neutral-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── Per-row update button ─────────────────────────────────────
function UpdateButton({ record, isOpen, onOpen, onClose, onUpdated }) {
  const btnRef = useRef(null);
  const [staff,     setStaff]     = useState([]);
  const [formState, setFormState] = useState({ status: record.status, staffId: record.staffid || "" });
  const [saving,    setSaving]    = useState(false);

  // Load staff when popup opens
  useEffect(() => {
    if (isOpen && record.hotelid) {
      getStaff(record.hotelid).then((r) => setStaff(r.data)).catch(() => {});
    }
  }, [isOpen, record.hotelid]);

  // Sync form to latest record values each time popup opens
  useEffect(() => {
    if (isOpen) setFormState({ status: record.status, staffId: record.staffid || "" });
  }, [isOpen, record.status, record.staffid]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMaintenance(record.maintenanceid, { status: formState.status, staffId: formState.staffId || null });
      toast.success("Record updated");
      onClose();
      onUpdated();
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => isOpen ? onClose() : onOpen(record.maintenanceid)}
        className={`flex items-center gap-1 text-xs font-jost font-medium border rounded-lg px-3 py-1.5 transition-colors ${
          isOpen ? "bg-brand-700 text-white border-brand-700" : "text-brand-700 border-brand-200 hover:bg-brand-50"
        }`}
      >
        <Wrench size={11} />
        Update
        <ChevronDown size={11} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <UpdatePopup
          staff={staff}
          saving={saving}
          formState={formState}
          onChange={setFormState}
          onSave={handleSave}
          onClose={onClose}
          anchorRef={btnRef}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminMaintenance() {
  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [filterStatus,setFilterStatus]= useState("All");
  const [filterHotel, setFilterHotel] = useState("All");
  const [search,      setSearch]      = useState("");

  // ONE popup open at a time — tracked by MaintenanceID
  const [openPopupId, setOpenPopupId] = useState(null);

  const fetchAll = useCallback(() => {
    getMaintenance()
      .then((r) => setRecords(r.data))
      .catch(() => toast.error("Failed to load maintenance records"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this maintenance record?")) return;
    try {
      await deleteMaintenance(id);
      toast.success("Record deleted");
      fetchAll();
    } catch {
      toast.error("Delete failed");
    }
  };

  const pending    = records.filter((r) => r.status === "Pending").length;
  const inProgress = records.filter((r) => r.status === "In Progress").length;
  const resolved   = records.filter((r) => r.status === "Resolved").length;
  const hotelNames = [...new Set(records.map((r) => r.hotelname).filter(Boolean))];

  const filtered = records.filter((r) => {
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    const matchHotel  = filterHotel  === "All" || r.hotelname === filterHotel;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.roomname?.toLowerCase().includes(q) ||
      r.hotelname?.toLowerCase().includes(q) ||
      r.issue?.toLowerCase().includes(q) ||
      r.staffname?.toLowerCase().includes(q);
    return matchStatus && matchHotel && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs tracking-[3px] text-brand-600 uppercase mb-1">Operations</p>
          <h1 className="font-playfair text-4xl font-normal">Maintenance</h1>
          <p className="font-jost font-light text-neutral-400 text-sm mt-1">Track and resolve room issues across all properties</p>
        </div>
        <button onClick={() => setShowModal(true)} className={BTN_PRIMARY}>
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Requests" value={records.length} color="bg-neutral-100 text-neutral-500" icon={Wrench} />
        <StatCard label="Pending"        value={pending}        color="bg-amber-50 text-amber-600"      icon={AlertTriangle} />
        <StatCard label="In Progress"    value={inProgress}     color="bg-blue-50 text-blue-600"        icon={Loader2} />
        <StatCard label="Resolved"       value={resolved}       color="bg-green-50 text-green-600"      icon={CheckCircle2} />
      </div>

      {/* Filters */}
      {/* <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search room, issue, staff…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-neutral-200 rounded-lg pl-8 pr-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 w-56"
          />
        </div>

        <div className="flex gap-1.5">
          {["All", "Pending", "In Progress", "Resolved"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`font-jost text-xs px-3 py-2 rounded-lg border transition-colors ${
                filterStatus === s ? "bg-brand-700 text-white border-brand-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}>
              {s}
            </button>
          ))}
        </div>

        {hotelNames.length > 1 && (
          <select className="border border-neutral-200 rounded-lg px-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 text-neutral-600"
            value={filterHotel} onChange={(e) => setFilterHotel(e.target.value)}>
            <option value="All">All Hotels</option>
            {hotelNames.map((h) => <option key={h}>{h}</option>)}
          </select>
        )}
      </div> */}

      <div className="flex flex-wrap gap-3 mb-6 items-center">

  {/* Search */}
  <div className="relative flex-1 min-w-[280px]">

    {!search && (
      <Filter
        size={13}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
      />
    )}

    <input
      type="text"
      placeholder="Search room, issue, staff…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className={`w-full border border-neutral-200 rounded-lg pr-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all ${
        search ? "pl-3" : "pl-8"
      }`}
    />
  </div>

  {/* Status pills */}
  <div className="flex gap-1.5">
    {["All", "Pending", "In Progress", "Resolved"].map((s) => (
      <button
        key={s}
        onClick={() => setFilterStatus(s)}
        className={`font-jost text-xs px-3 py-2 rounded-lg border transition-colors ${
          filterStatus === s
            ? "bg-brand-700 text-white border-brand-700"
            : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
        }`}
      >
        {s}
      </button>
    ))}
  </div>

  {/* Hotel filter */}
  {hotelNames.length > 1 && (
    <select
      className="border border-neutral-200 rounded-lg px-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 text-neutral-600"
      value={filterHotel}
      onChange={(e) => setFilterHotel(e.target.value)}
    >
      <option value="All">All Hotels</option>
      {hotelNames.map((h) => (
        <option key={h}>{h}</option>
      ))}
    </select>
  )}

</div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center font-jost font-light text-neutral-400 flex flex-col items-center gap-3">
            <Loader2 size={22} className="animate-spin text-brand-400" />
            Loading maintenance records…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Wrench size={22} className="text-neutral-300" />
            </div>
            <p className="font-playfair text-xl text-neutral-300 mb-1">No records found</p>
            <p className="font-jost font-light text-neutral-400 text-sm">
              {filterStatus !== "All" || search ? "Try adjusting your filters" : "All rooms are running smoothly"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
<table className="w-full text-sm font-jost border-separate border-spacing-0">
<thead className="bg-neutral-50">
    <tr>  
    {["#", "Property & Room", "Issue", "Assigned To", "Status", "Actions"].map((h) => (
     <th
  key={h}
  className="text-left px-6 py-4 text-xs font-medium text-neutral-400 uppercase tracking-wide whitespace-nowrap"
>
        {h}
      </th>
    ))}
  </tr>
</thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map((r) => (
                  <tr key={r.maintenanceid} className="hover:bg-neutral-50/70 transition-colors group">
                    <td className="px-5 py-4 text-neutral-300 text-xs font-light">#{r.maintenanceid}</td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-neutral-800 whitespace-nowrap">{r.roomname}</div>
                      <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                        <Hotel size={10} />{r.hotelname}
                      </div>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-neutral-700 leading-relaxed line-clamp-2">{r.issue}</p>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {r.staffname ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-medium flex-shrink-0">
                            {r.staffname[0]}
                          </div>
                          <span className="text-neutral-700 text-sm">{r.staffname}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-300 font-light italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-4"><StatusBadge status={r.status} /></td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <UpdateButton
                          record={r}
                          isOpen={openPopupId === r.maintenanceid}
                          onOpen={(id) => setOpenPopupId(id)}
                          onClose={() => setOpenPopupId(null)}
                          onUpdated={fetchAll}
                        />
                        {r.status === "Resolved" && (
                          <button onClick={() => handleDelete(r.maintenanceid)}
                            className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete record">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-neutral-50 bg-neutral-50/50">
              <p className="font-jost text-xs text-neutral-400">Showing {filtered.length} of {records.length} records</p>
            </div>
          </div>
        )}
      </div>

      {showModal && <NewRequestModal onClose={() => setShowModal(false)} onCreated={fetchAll} />}
    </div>
  );
}