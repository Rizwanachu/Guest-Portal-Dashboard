import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, BookOpen, Users, Menu, X, Building2,
  BedDouble, UserCheck, BarChart3, LogOut, ChevronDown,
  ChevronRight, Settings, Plus, Globe, Shield,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";

type NavItem = {
  href?: string;
  label: string;
  icon: React.ElementType;
  children?: { href: string; label: string; icon: React.ElementType }[];
};

const mainNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: BookOpen },
  { href: "/guests/search", label: "Guests", icon: Users },
];

const hotelNav: NavItem[] = [
  { href: "/hotel/profile", label: "Hotel Profile", icon: Building2 },
  { href: "/hotel/rooms", label: "Rooms", icon: BedDouble },
  { href: "/hotel/staff", label: "Staff", icon: UserCheck },
];

const reportsNav: NavItem[] = [
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function NavLink({
  href, label, icon: Icon, location, onClick,
}: { href: string; label: string; icon: React.ElementType; location: string; onClick?: () => void }) {
  const isActive = location === href || (href !== "/" && location.startsWith(href));
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium relative ${isActive ? "text-indigo-700" : "text-slate-500 hover:text-slate-800"}`}
      style={isActive
        ? { background: "rgba(99,102,241,0.11)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 1px 0 rgba(255,255,255,0.75) inset" }
        : { border: "1px solid transparent" }}>
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-500" : "text-slate-400"}`} />
      {label}
      {isActive && <span className="absolute right-3 w-1.5 h-1.5 rounded-full" style={{ background: "rgba(99,102,241,0.6)" }} />}
    </Link>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-1">
      <p className="px-3 mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {children}
    </div>
  );
}

function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const roleColors: Record<string, string> = {
    super_admin: "text-red-500 bg-red-50",
    admin: "text-indigo-600 bg-indigo-50",
    staff: "text-slate-500 bg-slate-50",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/40"
        style={{ border: "1px solid transparent" }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 2px 6px rgba(99,102,241,0.3)" }}>
          {getInitials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">{user.name}</p>
          <p className={`text-[10px] font-medium px-1 rounded capitalize inline-block mt-0.5 ${roleColors[user.role] ?? roleColors.staff}`}>
            {user.role.replace("_", " ")}
          </p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden z-50"
            style={{ background: "rgba(255,255,255,0.96)", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 -8px 32px rgba(0,0,0,0.08), 0 -2px 8px rgba(99,102,241,0.06)" }}
          >
            <div className="px-3 py-2.5 border-b border-indigo-50">
              <p className="text-xs font-semibold text-slate-700 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
            <div className="p-1">
              <Link href="/hotel/profile" onClick={() => { setOpen(false); onNavigate?.(); }}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-indigo-50 transition-colors">
                <Settings className="w-3.5 h-3.5 text-slate-400" />Settings
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                <LogOut className="w-3.5 h-3.5" />Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarNav({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
            style={{ background: "linear-gradient(145deg, rgba(99,102,241,0.9), rgba(139,92,246,0.85))", boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(99,102,241,0.35)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <span className="font-bold text-white text-sm leading-none tracking-tight">CI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[17px] text-foreground tracking-tight">CheckInn</span>
            <span className="text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(99,102,241,0.12)", color: "hsl(245 80% 55%)", border: "1px solid rgba(99,102,241,0.2)" }}>
              Beta
            </span>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-2" style={{ height: "1px", background: "rgba(99,102,241,0.1)" }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 flex flex-col gap-0.5 overflow-y-auto">
        {/* Main */}
        {mainNav.map((item) => (
          <NavLink key={item.href} href={item.href!} label={item.label} icon={item.icon} location={location} onClick={onNavigate} />
        ))}

        <div className="my-2 mx-1" style={{ height: "1px", background: "rgba(0,0,0,0.05)" }} />

        {/* Hotel Management */}
        <NavSection label="Hotel">
          {hotelNav.map((item) => (
            <NavLink key={item.href} href={item.href!} label={item.label} icon={item.icon} location={location} onClick={onNavigate} />
          ))}
        </NavSection>

        <div className="my-2 mx-1" style={{ height: "1px", background: "rgba(0,0,0,0.05)" }} />

        {/* Reports */}
        <NavSection label="Analytics">
          {reportsNav.map((item) => (
            <NavLink key={item.href} href={item.href!} label={item.label} icon={item.icon} location={location} onClick={onNavigate} />
          ))}
        </NavSection>

        <div className="my-2 mx-1" style={{ height: "1px", background: "rgba(0,0,0,0.05)" }} />

        {/* Quick Action */}
        <Link href="/bookings/new" onClick={onNavigate}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl transition-all text-indigo-600 font-medium hover:bg-indigo-50"
          style={{ border: "1px solid rgba(99,102,241,0.12)", background: "rgba(99,102,241,0.05)" }}>
          <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px] shrink-0">+</span>
          New Booking
        </Link>
      </nav>

      {/* User Footer */}
      <div className="p-3 pt-2">
        <div className="rounded-xl p-1" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.75)" }}>
          <UserMenu onNavigate={onNavigate} />
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
      <div className="md:hidden h-14 flex items-center px-4 shrink-0 justify-between z-30 glass-topbar sticky top-0">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors" aria-label="Open menu">
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
