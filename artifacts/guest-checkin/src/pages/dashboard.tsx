import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetBookingStats, useListRecentBookings } from "@workspace/api-client-react";
import { Users, FileText, CheckCircle2, Clock, Globe } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetBookingStats();
  const { data: recent, isLoading: recentLoading } = useListRecentBookings();

  if (statsLoading || recentLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
          </div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Welcome back, Staff</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening at the front desk today.</p>
        </div>
        <Link href="/bookings/new" className="hidden sm:block">
          <Button>Create Booking</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Today's Arrivals" value={stats?.todayCheckins || 0} icon={Users} color="text-blue-600" />
        <StatCard title="Pending Checks" value={stats?.pendingBookings || 0} icon={Clock} color="text-amber-600" />
        <StatCard title="Completed" value={stats?.completedBookings || 0} icon={CheckCircle2} color="text-emerald-600" />
        <StatCard title="Foreign Nationals" value={stats?.foreignNationals || 0} icon={Globe} color="text-purple-600" />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif">Recent Bookings</h2>
        <Link href="/bookings" className="text-sm text-primary hover:underline font-medium">View all</Link>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Guest Name</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent && recent.length > 0 ? (
              recent.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs">{booking.bookingRef}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/bookings/${booking.id}`} className="hover:text-primary hover:underline">
                      {booking.guestName}
                    </Link>
                  </TableCell>
                  <TableCell>{booking.roomNumber}</TableCell>
                  <TableCell>{new Date(booking.checkInDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={booking.status === 'completed' ? 'success' : 'warning'}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No recent bookings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      <div className="sm:hidden mt-6">
        <Link href="/bookings/new">
          <Button className="w-full">Create Booking</Button>
        </Link>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-serif mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-full bg-muted/50 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}
