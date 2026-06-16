"use client";
import Link from "next/link";
import { useAuth } from "./../app/AuthContext";
import { useState , useEffect} from "react";
import { Menu, X, Hotel } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

useEffect(() => {
  console.log("user is:",user)
}, [user])


  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur border-b border-brand-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Hotel className="text-brand-700 w-5 h-5" />
          <span className="font-playfair text-xl font-semibold text-brand-800">HMS System</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 font-jost text-sm font-medium">
          <Link href="/" className="text-neutral-600 hover:text-brand-700 transition-colors">Home</Link>
          <Link href="/hotels" className="text-neutral-600 hover:text-brand-700 transition-colors">Hotels</Link>

          {user ? (
            <>
              {user.roleid == 1 && (
                <Link href="/admin" className="text-neutral-600 hover:text-brand-700 transition-colors">Admin Panel</Link>
              ) }
              
              {user.roleid == 2 && (
                <Link href="/customer/dashboard" className="text-neutral-600 hover:text-brand-700 transition-colors">My Bookings</Link>
              )}
              <div className="flex items-center gap-3 ml-2">
                <span className="text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-3 py-1">
                  {user.name} · {user.role}
                </span>
                <button
                  onClick={logout}
                  className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <Link href="/auth/login" className="text-neutral-600 hover:text-brand-700 transition-colors">Login</Link>
              <Link href="/auth/signup" className="bg-brand-700 text-white px-4 py-1.5 rounded-md hover:bg-brand-800 transition-colors text-xs tracking-wide">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-brand-100 px-6 py-4 space-y-3 font-jost text-sm">
          <Link href="/" className="block text-neutral-600 hover:text-brand-700" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/hotels" className="block text-neutral-600 hover:text-brand-700" onClick={() => setMenuOpen(false)}>Hotels</Link>
          {user ? (
            <>
              {user.roleid === 1
                ? <Link href="/admin" className="block text-neutral-600 hover:text-brand-700" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
                : <Link href="/customer/dashboard" className="block text-neutral-600 hover:text-brand-700" onClick={() => setMenuOpen(false)}>My Bookings</Link>
              }
              <button onClick={() => { logout(); setMenuOpen(false); }} className="text-red-500 text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-neutral-600 hover:text-brand-700" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/auth/signup" className="block text-brand-700 font-medium" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}