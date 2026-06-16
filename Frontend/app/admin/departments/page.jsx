"use client";
import { useEffect, useState } from "react";
import { getHotels, getDepartments, createDepartment, updateDepartment, deleteDepartment, getStaff, createStaff, updateStaff, deleteStaff } from "../../../app/api";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Users, Building2 } from "lucide-react";

const INPUT = "w-full border border-neutral-200 rounded-lg px-3 py-2 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300";
const BTN = "bg-brand-700 text-white font-jost font-medium px-4 py-2 rounded-lg text-sm hover:bg-brand-800 transition-colors flex items-center gap-2";

export default function AdminDepartments() {
  const [depts, setDepts] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState("");

  // Dept form
  const [deptForm, setDeptForm] = useState({ name: "", editId: null });
  const [showDeptForm, setShowDeptForm] = useState(false);

  // Staff form
  const [staffForm, setStaffForm] = useState({ name: "", role: "", deptId: "", editId: null });
  const [showStaffForm, setShowStaffForm] = useState(false);

  const fetchDepts = () => getDepartments().then((r) => setDepts(r.data)).catch(() => {});
  const fetchHotels = () => getHotels().then((r) => { setHotels(r.data); if (r.data.length) setSelectedHotel(r.data[0].hotelid); }).catch(() => {});
  const fetchStaff = (hotelId) => { if (hotelId) getStaff(hotelId).then((r) => setStaff(r.data)).catch(() => {}); };

  useEffect(() => { fetchDepts(); fetchHotels(); }, []);
  useEffect(() => { fetchStaff(selectedHotel); }, [selectedHotel]);

  const saveDept = async () => {
    try {
      if (deptForm.editId) { await updateDepartment(deptForm.editId, { deptName: deptForm.name }); toast.success("Department updated"); }
      else { await createDepartment({ deptName: deptForm.name }); toast.success("Department created"); }
      setDeptForm({ name: "", editId: null }); setShowDeptForm(false); fetchDepts();
    } catch { toast.error("Failed to save department"); }
  };

  const delDept = async (id) => {
    if (!confirm("Delete department?")) return;
    try { await deleteDepartment(id); toast.success("Deleted"); fetchDepts(); }
    catch { toast.error("Cannot delete — staff may be assigned"); }
  };

  const saveStaff = async () => {
    try {
      if (staffForm.editId) { await updateStaff(staffForm.editId, { name: staffForm.name, role: staffForm.role, deptId: staffForm.deptId || null }); toast.success("Staff updated"); }
      else { await createStaff(selectedHotel, { name: staffForm.name, role: staffForm.role, deptId: staffForm.deptId || null }); toast.success("Staff added"); }
      setStaffForm({ name: "", role: "", deptId: "", editId: null }); setShowStaffForm(false); fetchStaff(selectedHotel);
    } catch { toast.error("Failed to save staff"); }
  };

  const delStaff = async (id) => {
    if (!confirm("Remove staff member?")) return;
    try { await deleteStaff(id); toast.success("Removed"); fetchStaff(selectedHotel); }
    catch { toast.error("Failed"); }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-[3px] text-brand-600 uppercase mb-1">Management</p>
        <h1 className="font-playfair text-4xl font-normal">Departments & Staff</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Departments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-2xl">Departments</h2>
            <button onClick={() => { setDeptForm({ name: "", editId: null }); setShowDeptForm(true); }} className={BTN}>
              <Plus size={14} /> Add
            </button>
          </div>

          {showDeptForm && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4 space-y-3">
              <input className={INPUT} value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Department name" />
              <div className="flex gap-2">
                <button onClick={saveDept} className="text-xs bg-brand-700 text-white px-4 py-2 rounded-lg font-jost font-medium hover:bg-brand-800">Save</button>
                <button onClick={() => setShowDeptForm(false)} className="text-xs border border-neutral-200 px-4 py-2 rounded-lg font-jost hover:bg-neutral-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-50">
            {depts.map((d) => (
              <div key={d.deptid} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors group">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-neutral-300" />
                  <span className="font-jost font-medium text-sm">{d.deptname}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setDeptForm({ name: d.deptname, editId: d.deptid }); setShowDeptForm(true); }} className="p-1.5 rounded text-neutral-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => delDept(d.deptid)} className="p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {depts.length === 0 && <div className="py-10 text-center font-jost font-light text-xs text-neutral-400">No departments yet</div>}
          </div>
        </div>

        {/* Staff */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-2xl">Staff</h2>
            <button onClick={() => { setStaffForm({ name: "", role: "", deptId: "", editId: null }); setShowStaffForm(true); }} className={BTN} disabled={!selectedHotel}>
              <Plus size={14} /> Add Staff
            </button>
          </div>

          {/* Hotel Selector */}
          <select className={`${INPUT} mb-4`} value={selectedHotel} onChange={(e) => setSelectedHotel(e.target.value)}>
            {hotels.map((h) => <option key={h.hotelid} value={h.hotelid}>{h.name}</option>)}
          </select>

          {showStaffForm && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4 space-y-3">
              <input className={INPUT} value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="Staff name" />
              <input className={INPUT} value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} placeholder="Role (e.g. Receptionist, Cleaner)" />
              <select className={INPUT} value={staffForm.deptId} onChange={(e) => setStaffForm({ ...staffForm, deptId: e.target.value })}>
                <option value="">No Department</option>
                {depts.map((d) => <option key={d.deptid} value={d.deptid}>{d.deptname}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={saveStaff} className="text-xs bg-brand-700 text-white px-4 py-2 rounded-lg font-jost font-medium hover:bg-brand-800">Save</button>
                <button onClick={() => setShowStaffForm(false)} className="text-xs border border-neutral-200 px-4 py-2 rounded-lg font-jost hover:bg-neutral-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-50">
            {staff.map((s) => (
              <div key={s.staffid} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-medium">{s.name[0]}</div>
                  <div>
                    <div className="font-jost font-medium text-sm">{s.name}</div>
                    <div className="font-jost text-xs text-neutral-400">{s.role} {s.deptname ? `· ${s.deptname}` : ""}</div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setStaffForm({ name: s.name, role: s.role, deptId: s.deptid || "", editId: s.staffid }); setShowStaffForm(true); }} className="p-1.5 rounded text-neutral-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => delStaff(s.staffid)} className="p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {staff.length === 0 && <div className="py-10 text-center font-jost font-light text-xs text-neutral-400">No staff for this hotel</div>}
          </div>
        </div>
      </div>
    </div>
  );
}