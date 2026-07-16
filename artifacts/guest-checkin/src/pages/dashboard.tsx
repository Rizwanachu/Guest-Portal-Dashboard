import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetBookingStats, useListRecentBookings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, CheckCircle2, Globe, TrendingUp, Plus, ArrowRight, Calendar } from "lucide-react";

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}
function getAvatarBg(name: string) {
  const colors = [
    'bg-indigo-400', 'bg-violet-400', 'bg-emerald-400',
    'bg-amber-400', 'bg-rose-400', 'bg-teal-400', 'bg-sky-400', 'bg-orange-400'
  ];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}
function StatusPill({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: "rgba(52,211,153,0.15)", color: "#059669", border: "1px solid rgba(52,211,153,0.3)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Completed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: "rgba(251,191,36,0.15)", color: "#d97706", border: "1px solid rgba(251,191,36,0.3)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending
    </span>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetBookingStats();
  const { data: recentBookings, isLoading: recentLoading } = useListRecentBookings();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">{greeting}, Staff</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{dateStr}</p>
        </div>
        <Link href="/bookings/new">
          <Button
            className="rounded-xl font-semibold text-white h-10 px-5 transition-all"
            style={{
              background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))",
              boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 16px rgba(99,102,241,0.3)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      {(statsLoading || recentLoading) ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Arrivals */}
            <div className="glass-stat-indigo rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-indigo-600/80 uppercase tracking-wider">Today's Arrivals</p>
                <div className="p-2 rounded-xl" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-4xl font-bold font-serif text-indigo-700">{stats?.todayCheckins ?? 0}</h3>
                <p className="text-[11px] text-indigo-500/80 flex items-center gap-1 mt-1.5">
                  <TrendingUp className="w-3 h-3" />+ 2 since yesterday
                </p>
              </div>
            </div>

            {/* Pending */}
            <div className="glass-stat-amber rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-amber-600/80 uppercase tracking-wider">Pending Check-ins</p>
                <div className="p-2 rounded-xl" style={{ background: "rgba(251,191,36,0.14)", border: "1px solid rgba(251,191,36,0.25)" }}>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-4xl font-bold font-serif text-amber-600">{stats?.pendingBookings ?? 0}</h3>
                <p className="text-[11px] text-amber-500/80 flex items-center gap-1 mt-1.5">
                  <TrendingUp className="w-3 h-3" />+ 1 since yesterday
                </p>
              </div>
            </div>

            {/* Completed */}
            <div className="glass-stat-emerald rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wider">Completed</p>
                <div className="p-2 rounded-xl" style={{ background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.25)" }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-4xl font-bold font-serif text-emerald-600">{stats?.completedBookings ?? 0}</h3>
                <p className="text-[11px] text-emerald-500/80 flex items-center gap-1 mt-1.5">
                  <TrendingUp className="w-3 h-3" />+ 5 since yesterday
                </p>
              </div>
            </div>

            {/* Foreign Nationals */}
            <div className="glass-stat-violet rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-violet-600/80 uppercase tracking-wider">Foreign Nationals</p>
                <div className="p-2 rounded-xl" style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.28)" }}>
                  <Globe className="w-4 h-4 text-violet-500" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-4xl font-bold font-serif text-violet-600">{stats?.foreignNationals ?? 0}</h3>
                <p className="text-[11px] text-violet-500/80 flex items-center gap-1 mt-1.5">
                  <TrendingUp className="w-3 h-3" />+ 0 since yesterday
                </p>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground tracking-tight">Recent Bookings</h2>
              <Link href="/bookings" className="text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden flex flex-col divide-y" style={{ divideColor: "rgba(99,102,241,0.08)" }}>
              {(!recentBookings || recentBookings.length === 0) ? (
                <div className="p-10 flex flex-col items-center justify-center text-slate-400">
                  <Calendar className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No recent bookings</p>
                </div>
              ) : (
                recentBookings.map((b, i) => (
                  <Link
                    key={b.id}
                    href={`/bookings/${b.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/40 cursor-pointer transition-all group block"
                    style={{ borderTop: i === 0 ? "none" : "1px solid rgba(99,102,241,0.07)" }}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 ${getAvatarBg(b.guestName)}`}
                        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                        {getInitials(b.guestName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{b.guestName}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{b.bookingRef}</p>
                      </div>
                      <div className="hidden sm:block text-right pr-4">
                        <p className="text-xs text-slate-500">{new Date(b.checkInDate).toLocaleDateString()}</p>
                        <p className="text-[11px] mt-1">
                          <span className="px-2 py-0.5 rounded-full text-slate-500"
                            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}>
                            Room {b.roomNumber || "TBD"}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0">
                        <StatusPill status={b.status} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
