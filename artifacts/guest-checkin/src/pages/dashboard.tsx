import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useGetBookingStats,
  useListRecentBookings,
  getListBookingsQueryKey,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Users,
  Clock,
  CheckCircle2,
  Globe,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  Calendar,
  BedDouble,
  LogOut,
  LogIn,
  Zap,
  Search,
  Bell,
  MoreHorizontal,
  Activity,
  RefreshCw,
  ChevronRight,
  UserCheck,
  ArrowUpRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}
function getAvatarBg(name: string) {
  const colors = [
    "bg-indigo-400","bg-violet-400","bg-emerald-400",
    "bg-amber-400","bg-rose-400","bg-teal-400","bg-sky-400","bg-orange-400",
  ];
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}
function StatusPill({ status }: { status: string }) {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{ background: "rgba(52,211,153,0.15)", color: "#059669", border: "1px solid rgba(52,211,153,0.3)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Completed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: "rgba(251,191,36,0.15)", color: "#d97706", border: "1px solid rgba(251,191,36,0.3)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending
    </span>
  );
}

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = value;
    prev.current = end;
    if (start === end) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display}</>;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass: string;
  bgStyle: React.CSSProperties;
  delay?: number;
}

function StatCard({ label, value, icon, trend, trendUp, colorClass, bgStyle, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="rounded-2xl p-5 flex flex-col justify-between cursor-default relative overflow-hidden"
      style={bgStyle}
    >
      {/* Specular highlight */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%)" }} />
      <div className="flex justify-between items-start relative">
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${colorClass}`}>{label}</p>
        <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.45)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 relative">
        <h3 className={`text-4xl font-bold font-serif ${colorClass.replace('/80','').replace('/70','')}`}>
          <AnimatedNumber value={value} />
        </h3>
        {trend && (
          <p className={`text-[11px] flex items-center gap-1 mt-1.5 ${colorClass}`}>
            {trendUp !== false ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Custom Chart Tooltip ────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-sm shadow-xl"
      style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.18)" }}>
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Activity Icon ───────────────────────────────────────────────────────────

function ActivityItem({ item, index }: { item: any; index: number }) {
  const isCompleted = item.status === "completed";
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      className="flex items-start gap-3 py-3"
      style={{ borderBottom: "1px solid rgba(99,102,241,0.07)" }}
    >
      <div className="shrink-0 mt-0.5">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarBg(item.guestName)}`}>
          {getInitials(item.guestName)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.guestName}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Room {item.roomNumber || "TBD"} ·{" "}
          {new Date(item.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <div className="shrink-0">
        <StatusPill status={item.status} />
      </div>
    </motion.div>
  );
}

// ─── Quick Action Button ─────────────────────────────────────────────────────

function QuickAction({ icon, label, href, color }: { icon: React.ReactNode; label: string; href: string; color: string }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer transition-all"
        style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color }}>
          {icon}
        </div>
        <p className="text-xs font-semibold text-slate-600 text-center leading-tight">{label}</p>
      </motion.div>
    </Link>
  );
}

// ─── Mini Calendar ───────────────────────────────────────────────────────────

function MiniCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{monthName}</p>
      <div className="grid grid-cols-7 gap-0.5">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-400 pb-1">{d}</div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {d !== null && (
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-medium transition-all ${
                d === today
                  ? "text-white font-bold"
                  : "text-slate-600 hover:bg-indigo-50"
              }`}
                style={d === today ? { background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 2px 8px rgba(99,102,241,0.4)" } : {}}>
                {d}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Today List Item ─────────────────────────────────────────────────────────

function TodayItem({ booking, type, index }: { booking: any; type: "arrival" | "departure"; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index }}
      className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: "1px solid rgba(99,102,241,0.06)" }}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${getAvatarBg(booking.guestName)}`}>
        {getInitials(booking.guestName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{booking.guestName}</p>
        <p className="text-[11px] text-slate-400">Room {booking.roomNumber || "TBD"}</p>
      </div>
      <Link href={`/bookings/${booking.id}`}>
        <ChevronRight className="w-4 h-4 text-slate-300 hover:text-indigo-400 transition-colors" />
      </Link>
    </motion.div>
  );
}

// ─── Notification Bell ───────────────────────────────────────────────────────

function NotificationBell({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 6px rgba(0,0,0,0.05)" }}
      >
        <Bell className="w-4 h-4 text-slate-500" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
            style={{ background: "linear-gradient(145deg, #f43f5e, #e11d48)" }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-72 rounded-2xl z-50 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(24px)", border: "1px solid rgba(99,102,241,0.18)", boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(99,102,241,0.1)" }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
              <p className="text-sm font-semibold text-slate-700">Notifications</p>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.12)", color: "hsl(245,80%,50%)" }}>{count} new</span>
            </div>
            <div className="divide-y divide-indigo-50 max-h-64 overflow-y-auto">
              <div className="px-4 py-3 flex items-start gap-3 hover:bg-indigo-50/40 transition-colors">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700">New check-in pending</p>
                  <p className="text-xs text-slate-400 mt-0.5">Review pending guests for today's arrivals</p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-start gap-3 hover:bg-indigo-50/40 transition-colors">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Departures due today</p>
                  <p className="text-xs text-slate-400 mt-0.5">Don't forget to process today's checkouts</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
              <p className="text-xs text-center text-indigo-500 font-medium cursor-pointer hover:text-indigo-700">View all notifications</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetBookingStats();
  const { data: recentBookings, isLoading: recentLoading } = useListRecentBookings();
  const [, setLocation] = useLocation();

  const { data: occupancy = [] } = useQuery({
    queryKey: ["occupancy"],
    queryFn: () => fetch("/api/bookings/occupancy").then((r) => r.json()),
    staleTime: 60_000,
  });
  const { data: todayArrivals = [] } = useQuery({
    queryKey: ["arrivals", "today"],
    queryFn: () => fetch("/api/bookings/arrivals").then((r) => r.json()),
    staleTime: 30_000,
  });
  const { data: todayDepartures = [] } = useQuery({
    queryKey: ["departures", "today"],
    queryFn: () => fetch("/api/bookings/departures").then((r) => r.json()),
    staleTime: 30_000,
  });

  const [searchValue, setSearchValue] = useState("");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const totalBookings = stats?.totalBookings ?? 0;
  const pendingBookings = stats?.pendingBookings ?? 0;
  const completedBookings = stats?.completedBookings ?? 0;
  const todayCheckins = stats?.todayCheckins ?? 0;
  const foreignNationals = stats?.foreignNationals ?? 0;
  const currentOccupied = occupancy[occupancy.length - 1]?.occupied ?? 0;

  const notificationCount = pendingBookings > 0 ? Math.min(pendingBookings, 9) : 0;

  const isLoading = statsLoading || recentLoading;

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">{greeting}, Staff</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchValue.trim()) {
                  setLocation(`/bookings?search=${encodeURIComponent(searchValue.trim())}`);
                }
              }}
              placeholder="Search bookings…"
              className="pl-8 pr-4 h-9 w-48 rounded-xl text-sm outline-none transition-all focus:w-64"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 6px rgba(0,0,0,0.05)" }}
            />
          </div>
          <NotificationBell count={notificationCount} />
          <Link href="/bookings/new">
            <Button
              className="rounded-xl font-semibold text-white h-9 px-4 text-sm transition-all"
              style={{
                background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))",
                boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 16px rgba(99,102,241,0.3)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />New Booking
            </Button>
          </Link>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Skeleton className="lg:col-span-8 h-64 rounded-2xl" />
            <Skeleton className="lg:col-span-4 h-64 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <StatCard label="Today's Arrivals" value={todayCheckins} delay={0}
              icon={<LogIn className="w-4 h-4 text-indigo-500" />}
              trend={`${todayArrivals.length} booked`} trendUp colorClass="text-indigo-600/80"
              bgStyle={{ background: "linear-gradient(145deg, rgba(99,102,241,0.13), rgba(255,255,255,0.6))", border: "1px solid rgba(99,102,241,0.22)", boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px rgba(99,102,241,0.1)" }} />
            <StatCard label="Today's Departures" value={todayDepartures.length} delay={0.06}
              icon={<LogOut className="w-4 h-4 text-rose-400" />}
              trend="checking out" colorClass="text-rose-500/80"
              bgStyle={{ background: "linear-gradient(145deg, rgba(244,63,94,0.10), rgba(255,255,255,0.6))", border: "1px solid rgba(244,63,94,0.18)", boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px rgba(244,63,94,0.08)" }} />
            <StatCard label="Active Bookings" value={currentOccupied} delay={0.12}
              icon={<BedDouble className="w-4 h-4 text-emerald-500" />}
              trend="rooms occupied" colorClass="text-emerald-600/80"
              bgStyle={{ background: "linear-gradient(145deg, rgba(52,211,153,0.12), rgba(255,255,255,0.6))", border: "1px solid rgba(52,211,153,0.22)", boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px rgba(52,211,153,0.1)" }} />
            <StatCard label="Pending Check-ins" value={pendingBookings} delay={0.18}
              icon={<Clock className="w-4 h-4 text-amber-500" />}
              trend="awaiting guests" colorClass="text-amber-600/80"
              bgStyle={{ background: "linear-gradient(145deg, rgba(251,191,36,0.13), rgba(255,255,255,0.6))", border: "1px solid rgba(251,191,36,0.24)", boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px rgba(251,191,36,0.1)" }} />
            <StatCard label="Completed" value={completedBookings} delay={0.24}
              icon={<CheckCircle2 className="w-4 h-4 text-teal-500" />}
              trend="all time" colorClass="text-teal-600/80"
              bgStyle={{ background: "linear-gradient(145deg, rgba(20,184,166,0.11), rgba(255,255,255,0.6))", border: "1px solid rgba(20,184,166,0.2)", boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px rgba(20,184,166,0.09)" }} />
            <StatCard label="Foreign Nationals" value={foreignNationals} delay={0.3}
              icon={<Globe className="w-4 h-4 text-violet-500" />}
              trend="FRRO required" colorClass="text-violet-600/80"
              bgStyle={{ background: "linear-gradient(145deg, rgba(167,139,250,0.13), rgba(255,255,255,0.6))", border: "1px solid rgba(167,139,250,0.24)", boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px rgba(167,139,250,0.1)" }} />
          </div>

          {/* ── Chart + Activity ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Occupancy Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-8 glass-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">Occupancy Overview</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Active bookings over the last 14 days</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Activity className="w-3.5 h-3.5" />
                  <span>14-day trend</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={occupancy} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="occupiedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="arrivalsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.07)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="occupied" name="Occupied" stroke="#6366f1" strokeWidth={2} fill="url(#occupiedGrad)" dot={false} activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="arrivals" name="Arrivals" stroke="#10b981" strokeWidth={1.5} fill="url(#arrivalsGrad)" dot={false} activeDot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="lg:col-span-4 glass-card rounded-2xl"
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">Activity Feed</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Latest booking activity</p>
                </div>
                <Activity className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <div className="px-5 overflow-y-auto" style={{ maxHeight: "232px" }}>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((item: any, i: number) => (
                    <ActivityItem key={item.id} item={item} index={i} />
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-indigo-200" />
                    <p className="text-sm text-slate-400">No activity yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── Today's Arrivals / Departures / Quick Actions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Today's Arrivals */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="glass-card rounded-2xl"
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
                    <LogIn className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-700">Today's Arrivals</h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "hsl(245,80%,50%)" }}>{todayArrivals.length}</span>
              </div>
              <div className="px-5 overflow-y-auto" style={{ maxHeight: "200px" }}>
                {todayArrivals.length > 0 ? (
                  todayArrivals.map((b: any, i: number) => (
                    <TodayItem key={b.id} booking={b} type="arrival" index={i} />
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <LogIn className="w-7 h-7 mx-auto mb-2 text-indigo-200" />
                    <p className="text-sm text-slate-400">No arrivals today</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Today's Departures */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="glass-card rounded-2xl"
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(244,63,94,0.1)" }}>
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-700">Today's Departures</h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(244,63,94,0.1)", color: "#e11d48" }}>{todayDepartures.length}</span>
              </div>
              <div className="px-5 overflow-y-auto" style={{ maxHeight: "200px" }}>
                {todayDepartures.length > 0 ? (
                  todayDepartures.map((b: any, i: number) => (
                    <TodayItem key={b.id} booking={b} type="departure" index={i} />
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <LogOut className="w-7 h-7 mx-auto mb-2 text-rose-200" />
                    <p className="text-sm text-slate-400">No departures today</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions + Mini Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.49 }}
              className="glass-card rounded-2xl p-5 flex flex-col gap-4"
            >
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2">
                  <QuickAction href="/bookings/new" label="New Booking"
                    icon={<Plus className="w-4 h-4 text-white" />}
                    color="linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))" />
                  <QuickAction href="/guests/search" label="Search Guests"
                    icon={<Search className="w-4 h-4 text-white" />}
                    color="linear-gradient(145deg, #10b981, #059669)" />
                  <QuickAction href="/bookings" label="All Bookings"
                    icon={<Calendar className="w-4 h-4 text-white" />}
                    color="linear-gradient(145deg, #f59e0b, #d97706)" />
                  <QuickAction href="/bookings?status=pending" label="Pending"
                    icon={<Clock className="w-4 h-4 text-white" />}
                    color="linear-gradient(145deg, #f43f5e, #e11d48)" />
                </div>
              </div>
              <div style={{ borderTop: "1px solid rgba(99,102,241,0.07)", paddingTop: "12px" }}>
                <MiniCalendar />
              </div>
            </motion.div>
          </div>

          {/* ── Recent Bookings ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Recent Bookings</h2>
              <Link href="/bookings" className="text-indigo-600 text-xs font-semibold hover:text-indigo-700 transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden">
              {!recentBookings || recentBookings.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                  <Calendar className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No bookings yet</p>
                  <p className="text-xs mt-1 opacity-70">Create your first booking to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
                        {["Guest", "Room", "Check-in", "Check-out", "Status", "Guests", ""].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.slice(0, 8).map((b: any, i: number) => (
                        <motion.tr
                          key={b.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.03 * i }}
                          className="hover:bg-white/40 transition-all group"
                          style={{ borderBottom: i < recentBookings.length - 1 ? "1px solid rgba(99,102,241,0.06)" : "none" }}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${getAvatarBg(b.guestName)}`}>
                                {getInitials(b.guestName)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{b.guestName}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{b.bookingRef}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium text-slate-600"
                              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.14)" }}>
                              {b.roomNumber || "TBD"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(b.checkInDate).toLocaleDateString()}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(b.checkOutDate).toLocaleDateString()}</td>
                          <td className="px-5 py-3.5"><StatusPill status={b.status} /></td>
                          <td className="px-5 py-3.5 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              {b.guestsSubmitted ?? 0}/{b.numberOfGuests}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link href={`/bookings/${b.id}`}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 hover:text-indigo-700 inline-flex items-center gap-1 text-xs font-semibold">
                              Open <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
