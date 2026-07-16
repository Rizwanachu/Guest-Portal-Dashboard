import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSearchGuests } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function GuestSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useSearchGuests(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 2 } }
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-foreground">Guest Search</h1>
        <p className="text-muted-foreground mt-1">Search through past and present guest records.</p>
      </div>

      <Card className="mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, phone, or passport..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </Card>

      <Card>
        {debouncedQuery.length <= 2 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-lg">Type at least 3 characters to search</p>
          </div>
        ) : isLoading ? (
          <div className="p-12 flex justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : results && results.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>ID Type</TableHead>
                <TableHead>Booking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">
                    {guest.fullName}
                    {guest.isForeignNational && (
                      <Badge variant="outline" className="ml-2 text-[10px] py-0 border-purple-200 text-purple-600 bg-purple-50">FRRO</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{guest.phone}</div>
                    <div className="text-xs text-muted-foreground">{guest.email}</div>
                  </TableCell>
                  <TableCell>{guest.nationality}</TableCell>
                  <TableCell className="uppercase text-xs tracking-wider">{guest.idType.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Link href={`/bookings/${guest.bookingId}`} className="text-primary hover:underline font-mono text-sm">
                      {guest.bookingRef}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium text-foreground mb-1">No guests found</p>
            <p>No records match "{debouncedQuery}"</p>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
