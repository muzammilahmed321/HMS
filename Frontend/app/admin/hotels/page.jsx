"use client";
import { useEffect, useState, useRef } from "react";
import { getHotels, deleteHotel, getHotelPictures, uploadHotelPicture, deleteHotelPicture } from "../../api";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Plus, Edit2, Trash2, Images, MapPin, Clock,
  X, ChevronLeft, ChevronRight, Upload, Loader2, ImageOff,
} from "lucide-react";

// extract clean URL from "url|publicId" DB format
const toUrl = (raw) => (raw?.includes("|") ? raw.split("|")[0] : raw ?? "");

// fix ISO datetime → "HH:MM"
const formatTime = (t) => {
  if (!t) return "—";
  if (t.includes("T")) return t.substring(11, 16);
  return String(t).substring(0, 5);
};

// ── Image Gallery / Lightbox Modal ─────────────────────────
function ImageGalleryModal({ hotel, onClose }) {
  const [pics, setPics] = useState([]);
  const [current, setCurrent] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [loadingPics, setLoadingPics] = useState(true);
  const fileRef = useRef();

  const fetchPics = () => {
    setLoadingPics(true);
    getHotelPictures(hotel.hotelid)
  .then((r) => {
    console.log("Pictures Response:", r.data);
    setPics(r.data);
  })
      .catch((e) => {
        console.error("Failed to load images:", e);
        toast.error("Failed to load images");
      })
      .finally(() => setLoadingPics(false));
  };

  useEffect(() => { fetchPics(); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") setCurrent((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setCurrent((p) => Math.min(pics.length - 1, p + 1));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pics.length]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        await uploadHotelPicture(hotel.hotelid, fd);
      }
      toast.success(`${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
      fetchPics();
    } catch {
      toast.error("Upload failed — check file size (max 8MB)");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (picId) => {
    if (!confirm("Remove this image from the hotel?")) return;
    console.log('picid',picId)
    setDeleting(picId);
    try {
      await deleteHotelPicture(picId);
      toast.success("Image removed");
      const updated = pics.filter((p) => p.hotelpicsid !== picId);
      setPics(updated);
      setCurrent((c) => Math.min(c, Math.max(0, updated.length - 1)));
    } catch(e) {
      toast.error("Failed to delete image");
      console.error("Delete error:", e);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div>
            <h2 className="font-playfair text-xl">{hotel.name}</h2>
            <p className="font-jost text-xs text-neutral-400 mt-0.5">
              {loadingPics ? "Loading…" : `${pics.length} photo${pics.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 cursor-pointer bg-brand-700 text-white font-jost font-medium text-sm px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
              {uploading
                ? <Loader2 size={14} className="animate-spin" />
                : <Upload size={14} />}
              {uploading ? "Uploading…" : "Add Photos"}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
            </label>
            <button onClick={onClose} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loadingPics ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-neutral-400 py-20">
              <Loader2 size={22} className="animate-spin text-brand-400" />
              <span className="font-jost font-light text-sm">Loading photos…</span>
            </div>
          ) : pics.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
              <ImageOff size={52} strokeWidth={1} className="text-neutral-200" />
              <div className="text-center">
                <p className="font-playfair text-xl text-neutral-300 mb-1">No photos yet</p>
                <p className="font-jost font-light text-sm text-neutral-400">Click "Add Photos" to upload images for this hotel</p>
              </div>
            </div>
          ) : (
            <>
              {/* Main image viewer */}
              <div className="relative bg-neutral-900 flex-1 flex items-center justify-center min-h-0" style={{ minHeight: "300px" }}>
                <img
                  src={pics[current]?.url}
                  alt={`Hotel photo ${current + 1}`}
                  className="max-w-full object-contain"
                  style={{ maxHeight: "100%" }}
                />

                {/* Prev / Next */}
                {pics.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrent((p) => Math.max(0, p - 1))}
                      disabled={current === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors disabled:opacity-20"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrent((p) => Math.min(pics.length - 1, p + 1))}
                      disabled={current === pics.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors disabled:opacity-20"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Bottom overlay — counter + delete */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <span className="bg-black/60 text-white font-jost text-xs px-3 py-1.5 rounded-full">
                    {current + 1} / {pics.length}
                  </span>
                  <button
                    onClick={() => handleDelete(pics[current].hotelPicsId)}
                    disabled={!!deleting}
                    className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white font-jost text-xs px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    {deleting === pics[current]?.hotelpicsid
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Trash2 size={11} />}
                    Remove this photo
                  </button>
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 p-3 overflow-x-auto bg-neutral-50 border-t border-neutral-100 flex-shrink-0">
                {pics.map((pic, i) => (
                  <button
                    key={pic.hotelpicsid}
                    onClick={() => setCurrent(i)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                      i === current
                        ? "border-brand-600 scale-105 shadow-md"
                        : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img src={pic.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Hotel Card ──────────────────────────────────────────────
function HotelCard({ hotel, onDelete, onViewPhotos }) {
  const mainImg = toUrl(hotel.mainimage);

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow duration-200">
      {/* Cover image — click opens gallery */}
      <div
        className="relative h-44 overflow-hidden bg-neutral-100 cursor-pointer"
        onClick={() => onViewPhotos(hotel)}
      >
        {mainImg ? (
          <img
            src={mainImg}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-300">
            <ImageOff size={30} strokeWidth={1} />
            <span className="font-jost text-xs">No photos yet</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Photo count pill */}
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1.5 bg-black/55 text-white font-jost text-xs px-2.5 py-1 rounded-full">
            <Images size={11} />
            {hotel.piccount ?? 0} photos
          </span>
        </div>

        {/* "View / Manage Photos" hover hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-white/90 text-brand-800 font-jost font-medium text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
            <Images size={12} /> Manage Photos
          </span>
        </div>
      </div>

      {/* Info block */}
      <div className="p-5">
        <h3 className="font-playfair text-lg mb-1">{hotel.name}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-jost font-light text-xs text-neutral-400 mb-4">
          <span className="flex items-center gap-1.5">
            <MapPin size={11} className="text-brand-400" />
            {hotel.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={11} className="text-brand-400" />
            In {formatTime(hotel.checkintime)} · Out {formatTime(hotel.checkouttime)}
          </span>
        </div>

        {/* Action row */}
        <div className="flex gap-2">
          <Link
            href={`/admin/hotels/${hotel.hotelid}/edit`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-jost font-medium border border-neutral-200 py-2 rounded-lg hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors"
          >
            <Edit2 size={12} /> Edit Details
          </Link>
          <button
            onClick={() => onViewPhotos(hotel)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-jost font-medium border border-neutral-200 py-2 rounded-lg hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors"
          >
            <Images size={12} /> Photos
          </button>
          <button
            onClick={() => onDelete(hotel.hotelid, hotel.name)}
            className="p-2 border border-neutral-200 rounded-lg text-neutral-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
            title="Delete hotel"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function AdminHotelsList() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [galleryHotel, setGalleryHotel] = useState(null);
  const [search, setSearch] = useState("");

  const fetchHotels = () => {
    setLoading(true);
    getHotels()
      .then((r) => setHotels(r.data))
      .catch(() => toast.error("Failed to load hotels"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHotels(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its data? This cannot be undone.`)) return;
    try {
      await deleteHotel(id);
      toast.success("Hotel deleted");
      fetchHotels();
    } catch {
      toast.error("Delete failed — hotel may have active bookings");
    }
  };

  const filtered = hotels.filter(
    (h) => !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs tracking-[3px] text-brand-600 uppercase mb-1">Management</p>
          <h1 className="font-playfair text-4xl font-normal">Hotels</h1>
          <p className="font-jost font-light text-neutral-400 text-sm mt-1">
            {hotels.length} propert{hotels.length !== 1 ? "ies" : "y"} registered
          </p>
        </div>
        <Link
          href="/admin/hotels/new"
          className="flex items-center gap-2 bg-brand-700 text-white font-jost font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-brand-800 transition-colors"
        >
          <Plus size={16} /> Add Hotel
        </Link>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-neutral-200 rounded-lg px-4 py-2.5 font-jost font-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 w-72"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-brand-400" />
          <span className="font-jost font-light text-sm text-neutral-400">Loading hotels…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-neutral-100">
          <MapPin size={36} strokeWidth={1} className="text-neutral-200 mx-auto mb-4" />
          <p className="font-playfair text-xl text-neutral-300 mb-1">
            {search ? "No hotels match your search" : "No hotels yet"}
          </p>
          <p className="font-jost font-light text-sm text-neutral-400 mb-6">
            {search ? "Try a different search term" : "Add your first property to get started"}
          </p>
          {!search && (
            <Link
              href="/admin/hotels/new"
              className="inline-flex items-center gap-2 bg-brand-700 text-white font-jost font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-brand-800 transition-colors"
            >
              <Plus size={14} /> Add First Hotel
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((hotel) => (
            <HotelCard
              key={hotel.hotelid}
              hotel={hotel}
              onDelete={handleDelete}
              onViewPhotos={setGalleryHotel}
            />
          ))}
        </div>
      )}

      {/* Gallery lightbox */}
      {galleryHotel && (
        <ImageGalleryModal hotel={galleryHotel} onClose={() => setGalleryHotel(null)} />
      )}
    </div>
  );
}