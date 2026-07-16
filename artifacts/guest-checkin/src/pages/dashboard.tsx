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
    'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-sky-500', 'bg-orange-500'
  ];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}
function StatusPill({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Completed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Pending
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
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">{greeting}, Staff</h1>
          <p className="text-muted-foreground mt-1">{dateStr}</p>
        </div>
        <Link href="/bookings/new">
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      {(statsLoading || recentLoading) ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Arrivals */}
            <div className="rounded-xl bg-card border border-card-border p-6 shadow-sm hover:shadow-md transition-shadow border-b-2 border-b-indigo-400 stat-glow-indigo flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm text-muted-foreground font-medium">Today's Arrivals</p>
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-4xl font-bold font-serif text-indigo-600">{stats?.todayCheckins ?? 0}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-indigo-500" />
                  + 2 since yesterday
                </p>
              </div>
            </div>

            {/* Pending Check-ins */}
            <div className="rounded-xl bg-card border border-card-border p-6 shadow-sm hover:shadow-md transition-shadow border-b-2 border-b-amber-400 stat-glow-amber flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm text-muted-foreground font-medium">Pending Check-ins</p>
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-4xl font-bold font-serif text-amber-600">{stats?.pendingBookings ?? 0}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-amber-500" />
                  + 1 since yesterday
                </p>
              </div>
            </div>

            {/* Completed */}
            <div className="rounded-xl bg-card border border-card-border p-6 shadow-sm hover:shadow-md transition-shadow border-b-2 border-b-emerald-400 stat-glow-emerald flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm text-muted-foreground font-medium">Completed</p>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-4xl font-bold font-serif text-emerald-600">{stats?.completedBookings ?? 0}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  + 5 since yesterday
                </p>
              </div>
            </div>

            {/* Foreign Nationals */}
            <div className="rounded-xl bg-card border border-card-border p-6 shadow-sm hover:shadow-md transition-shadow border-b-2 border-b-violet-400 stat-glow-violet flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm text-muted-foreground font-medium">Foreign Nationals</p>
                <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
                  <Globe className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-4xl font-bold font-serif text-violet-600">{stats?.foreignNationals ?? 0}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-violet-500" />
                  + 0 since yesterday
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Bookings</h2>
              <Link href="/bookings" className="text-primary text-sm font-medium hover:underline flex items-center">
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden flex flex-col divide-y divide-border">
              {(!recentBookings || recentBookings.length === 0) ? (
                <div className="p-10 flex flex-col items-center justify-center text-muted-foreground">
                  <Calendar className="w-10 h-10 mb-3 opacity-20" />
                  <p>No recent bookings</p>
                </div>
              ) : (
                recentBookings.map(b => (
                  <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors group block">
                    <div className="flex items-center gap-4 w-full">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0 ${getAvatarBg(b.guestName)}`}>
                        {getInitials(b.guestName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{b.guestName}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{b.bookingRef}</p>
                      </div>
                      <div className="hidden sm:block text-right pr-4">
                        <p className="text-sm text-muted-foreground">{new Date(b.checkInDate).toLocaleDateString()}</p>
                        <p className="text-xs mt-1">
                          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
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
