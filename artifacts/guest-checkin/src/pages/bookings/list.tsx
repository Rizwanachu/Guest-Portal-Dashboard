import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListBookings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Search, Plus, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name: string): string {
  return name.split(' ').map((p: string) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function getAvatarBg(name: string): string {
  const colors = [
    'bg-indigo-400', 'bg-violet-400', 'bg-emerald-400',
    'bg-amber-400', 'bg-rose-400', 'bg-teal-400', 'bg-sky-400', 'bg-orange-400'
  ];
  const idx = name.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

function StatusPill({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: "rgba(52,211,153,0.14)", color: "#059669", border: "1px solid rgba(52,211,153,0.28)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: "rgba(251,191,36,0.14)", color: "#d97706", border: "1px solid rgba(251,191,36,0.28)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Pending
    </span>
  );
}

export default function BookingsList() {
  const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const { data, isLoading } = useListBookings({
    status: activeStatus === 'all' ? undefined : activeStatus
  });
  const bookings = data?.bookings;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Bookings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage all guest reservations</p>
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

      {/* Search + filter bar */}
      <div className="glass-card rounded-2xl p-4 mb-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            className="rounded-xl h-10 pl-10 w-full text-sm glass-input"
            placeholder="Search bookings..."
          />
        </div>
        <div className="flex gap-1.5 mt-3">
          {(['all', 'pending', 'completed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={
                activeStatus === s
                  ? {
                      background: "rgba(99,102,241,0.13)",
                      color: "hsl(245,80%,50%)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset",
                    }
                  : {
                      background: "transparent",
                      color: "#64748b",
                      border: "1px solid transparent",
                    }
              }
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
                {["Guest", "Room", "Check-in", "Check-out", "Status", ""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                    <td colSpan={6} className="px-5 py-3">
                      <Skeleton className="h-9 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : bookings?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <BookOpen className="w-10 h-10 mx-auto opacity-10 mb-3 text-indigo-400" />
                    <p className="font-medium text-slate-600">No bookings found</p>
                    <p className="text-sm mt-1 text-slate-400">Try adjusting your filters or create a new booking.</p>
                  </td>
                </tr>
              ) : (
                bookings?.map((b, i) => (
                  <tr
                    key={b.id}
                    className="hover:bg-white/35 transition-all group"
                    style={{ borderBottom: i < (bookings.length - 1) ? "1px solid rgba(99,102,241,0.06)" : "none" }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${getAvatarBg(b.guestName)}`}
                          style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}
                        >
                          {getInitials(b.guestName)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{b.guestName}</p>
                          {b.phone && <p className="text-xs text-slate-400 mt-0.5">{b.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-slate-600"
                        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.14)" }}
                      >
                        {b.roomNumber || "TBD"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(b.checkInDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(b.checkOutDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="text-indigo-600 text-xs font-semibold hover:text-indigo-700 transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
