import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, Users, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: BookOpen },
  { href: "/guests/search", label: "Guests", icon: Users },
];

function SidebarNav({
  location,
  onNavigate,
}: {
  location: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-5">
        <div className="flex items-center gap-3">
          {/* Glass monogram */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(99,102,241,0.9), rgba(139,92,246,0.85))",
              boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(99,102,241,0.35)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <span className="font-bold text-white text-sm leading-none tracking-tight">CI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[17px] text-foreground tracking-tight">
              CheckInn
            </span>
            <span
              className="text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                background: "rgba(99,102,241,0.12)",
                color: "hsl(245 80% 55%)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              Beta
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-3" style={{ height: "1px", background: "rgba(99,102,241,0.1)" }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium relative ${
                isActive
                  ? "text-indigo-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              style={
                isActive
                  ? {
                      background: "rgba(99,102,241,0.11)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      boxShadow: "0 1px 0 rgba(255,255,255,0.75) inset",
                    }
                  : {
                      border: "1px solid transparent",
                    }
              }
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-indigo-500" : "text-slate-400"
                }`}
              />
              {item.label}
              {isActive && (
                <span
                  className="absolute right-3 w-1.5 h-1.5 rounded-full"
                  style={{ background: "rgba(99,102,241,0.6)" }}
                />
              )}
            </Link>
          );
        })}

        <div className="my-3 mx-1" style={{ height: "1px", background: "rgba(0,0,0,0.06)" }} />

        <Link
          href="/bookings/new"
          onClick={onNavigate}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl transition-all text-indigo-600 font-medium hover:bg-indigo-50"
          style={{ border: "1px solid transparent" }}
        >
          <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px] shrink-0">+</span>
          New Booking
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-5 pt-3">
        <div
          className="rounded-xl px-3 py-2.5 text-[11px] text-slate-400"
          style={{
            background: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
        >
          <p className="font-medium text-slate-500">CheckInn</p>
          <p>v1.0 · Hotel Guest Check-in</p>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div
        className="md:hidden h-14 flex items-center px-4 shrink-0 justify-between z-30 glass-topbar sticky top-0"
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-serif font-bold text-lg text-foreground">CheckInn</span>
        <div className="w-9" />
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0 glass-sidebar">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarNav location={location} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[252px] shrink-0 fixed inset-y-0 left-0 z-20 glass-sidebar">
        <SidebarNav location={location} />
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-[252px] min-h-screen overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
