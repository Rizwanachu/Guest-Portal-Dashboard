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
    'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-sky-500', 'bg-orange-500'
  ];
  const idx = name.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

function StatusPill({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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
          <h1 className="font-serif text-2xl font-semibold text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage all guest reservations</p>
        </div>
        <Link href="/bookings/new">
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-xl border border-card-border p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            className="rounded-full h-11 pl-10 shadow-sm w-full bg-background border-border focus-visible:ring-primary/50" 
            placeholder="Search bookings..." 
          />
        </div>
        <div className="flex gap-2 mt-4">
          {(['all', 'pending', 'completed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeStatus === s 
                  ? 'bg-primary text-white' 
                  : 'text-muted-foreground hover:text-foreground bg-transparent'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-card-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Guest</th>
                <th className="px-6 py-4 font-medium">Room</th>
                <th className="px-6 py-4 font-medium">Check-in</th>
                <th className="px-6 py-4 font-medium">Check-out</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ))
              ) : bookings?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto opacity-20 mb-3" />
                    <p className="font-medium text-foreground">No bookings found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or create a new booking.</p>
                  </td>
                </tr>
              ) : (
                bookings?.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 ${getAvatarBg(b.guestName)}`}>
                          {getInitials(b.guestName)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{b.guestName}</p>
                          {b.phone && <p className="text-xs text-muted-foreground">{b.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-xs font-mono">
                        {b.roomNumber || "TBD"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {new Date(b.checkInDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {new Date(b.checkOutDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/bookings/${b.id}`} className="text-primary text-sm font-medium hover:underline">
                        View &rarr;
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
