import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { useSearchGuests } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Search, Loader2, Globe } from "lucide-react";
import { Link } from "wouter";
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

export default function GuestSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useSearchGuests(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 2, queryKey: ['searchGuests', debouncedQuery] } }
  );

  return (
    <AdminLayout>
      <div className="py-10 text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Find a Guest</h1>
        <p className="text-muted-foreground mt-3">Search by name, phone, email, or passport number</p>
        
        <div className="relative max-w-xl mx-auto mt-8">
          {isLoading ? (
            <Loader2 className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : (
            <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input 
            className="h-14 rounded-full shadow-md pl-14 text-lg border-2 focus-visible:border-primary focus-visible:ring-0 bg-card transition-all"
            placeholder="Start typing..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto pb-12">
        {debouncedQuery.length <= 2 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Search className="w-16 h-16 opacity-10 mb-4" />
            <p className="font-medium">Start typing to find guests</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-[220px] rounded-xl" />)}
          </div>
        ) : results?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
            <Search className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-medium text-foreground">No guests match "{query}"</p>
            <p className="mt-1">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results?.map((guest, index) => (
              <Link 
                key={guest.id} 
                href={`/bookings/${guest.bookingId}`}
                className="block outline-none"
              >
                <div 
                  className="rounded-xl bg-card border border-card-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer p-5 flex flex-col h-full animate-in fade-in-0 slide-in-from-bottom-4 group"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-inner ${getAvatarBg(guest.fullName)}`}>
                      {getInitials(guest.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate flex items-center gap-2">
                        {guest.fullName}
                        {guest.isForeignNational && (
                          <span className="bg-violet-100 text-violet-700 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0">FRRO</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                        <Globe className="w-3.5 h-3.5 shrink-0" /> {guest.nationality}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1 mb-4">
                    {guest.phone && <p className="truncate">{guest.phone}</p>}
                    {guest.email && <p className="truncate">{guest.email}</p>}
                    {!guest.phone && !guest.email && <p className="italic">No contact info</p>}
                  </div>

                  <div className="mt-auto border-t border-border pt-4 flex items-center justify-between">
                    <span className="font-mono text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded uppercase tracking-wider">
                      {guest.idType.replace('_', ' ')}
                    </span>
                    <span className="text-primary text-sm font-medium group-hover:underline flex items-center">
                      View Booking &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
