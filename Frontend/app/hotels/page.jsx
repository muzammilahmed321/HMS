"use client";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { getHotels } from "../api";
import { MapPin, Clock, ArrowRight } from "lucide-react";

const toUrl = (raw) => (raw?.includes("|") ? raw.split("|")[0] : raw ?? "");

const formatTime = (t) => {
  if (!t) return "—";
  if (t.includes("T")) return t.substring(11, 16);
  return String(t).substring(0, 5);
};
export default function HotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHotels()
      .then((r) => setHotels(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-20 max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs tracking-[4px] text-brand-600 uppercase mb-3">Our Properties</p>
          <h1 className="font-playfair text-5xl font-normal mb-4">Discover Our Hotels</h1>
          <div className="w-16 h-px bg-brand-300 mx-auto" />
        </div>

        {loading ? (
          <div className="text-center py-20 font-jost font-light text-neutral-400">Loading hotels...</div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-20 font-jost font-light text-neutral-400">No hotels available yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel) => (
              <Link key={hotel.hotelid} href={`/hotels/${hotel.hotelid}`}>
                <div className="group rounded-2xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={   toUrl(hotel.mainimage)|| "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80"}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-playfair text-xl mb-2">{hotel.name}</h3>
                    <div className="flex items-center gap-1 text-neutral-400 text-xs font-jost mb-2">
                      <MapPin size={12} />
                      <span>{hotel.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-400 text-xs font-jost mb-4">
                      <Clock size={12} />
               
                      <span>Check-in: {formatTime(hotel.checkintime)} · Check-out: {formatTime(hotel.checkouttime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-jost text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-3 py-1">View Rooms</span>
                      <ArrowRight size={16} className="text-brand-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}