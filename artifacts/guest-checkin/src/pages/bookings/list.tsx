import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useListBookings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Select } from "@/components/ui/select";

export default function BookingsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "completed">("all");
  
  const { data, isLoading } = useListBookings({ 
    search: search.length > 2 ? search : undefined,
    status: status === "all" ? undefined : status
  });

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage guest arrivals and statuses.</p>
        </div>
        <Link href="/bookings/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Booking
          </Button>
        </Link>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, ref, or room..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48 flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading bookings...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Guest Name</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.bookings && data.bookings.length > 0 ? (
                data.bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">{booking.bookingRef}</TableCell>
                    <TableCell className="font-medium">{booking.guestName}</TableCell>
                    <TableCell>{booking.roomNumber}</TableCell>
                    <TableCell>{new Date(booking.checkInDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(booking.checkOutDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={booking.status === 'completed' ? 'success' : 'warning'}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/bookings/${booking.id}`}>
                        <Button variant="ghost" size="sm">Manage</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <p className="text-lg font-medium text-foreground mb-1">No bookings found</p>
                    <p>Try adjusting your search or filters.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </AdminLayout>
  );
}
