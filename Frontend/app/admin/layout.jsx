"use client";
import { useAuth } from "../AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Hotel, Bed, Calendar, Users, Wrench, Star, LogOut, LayoutDashboard, Building2, Home } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/hotels", label: "Hotels", icon: Building2 },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/departments", label: "Departments", icon: Users },
  { href: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/", label: "Home", icon: Home },
];

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;                          // ← wait, do nothing until auth resolves

    if (!user) {
      router.push("/auth/login");                 // not logged in → login page
    } else if (user.role !== "Admin") {
      router.push("/customer/dashboard");         // logged in but not admin → customer
    }
    // if user.role === "Admin" → do nothing, stay on page
  }, [user, loading]);

  // ✅ correct — only block render while still loading
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="font-jost font-light text-neutral-400">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-neutral-100">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-brand-800 text-white flex flex-col fixed top-0 left-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-brand-700">
          <div className="flex items-center gap-2">
            <Hotel size={20} className="text-brand-300" />
            <div>
              <div className="font-playfair text-lg font-semibold">HMS System</div>
              <div className="font-jost text-xs text-brand-300 -mt-0.5">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
           const active =
  href === "/"
    ? pathname === "/"
    : href === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-jost text-sm transition-all ${active ? "bg-brand-600 text-white" : "text-brand-200 hover:bg-brand-700 hover:text-white"}`}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}


        {
          user && (
            <div className="p-4 border-t border-brand-700">
              <div className="mb-3">
                <div className="font-jost text-sm font-medium">{user.name}</div>
                <div className="font-jost text-xs text-brand-300">{user.email}</div>
              </div>
              <button onClick={logout} className="flex items-center gap-2 text-brand-300 hover:text-white font-jost text-xs transition-colors">
                <LogOut size={14} /> Sign Out
              </button>
            </div>

          )
        }




      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}