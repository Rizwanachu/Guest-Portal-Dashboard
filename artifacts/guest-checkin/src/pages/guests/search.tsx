import { AdminLayout } from "@/components/layout/AdminLayout";
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
    'bg-indigo-400', 'bg-violet-400', 'bg-emerald-400',
    'bg-amber-400', 'bg-rose-400', 'bg-teal-400', 'bg-sky-400', 'bg-orange-400'
  ];
  const idx = name.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

export default function GuestSearch() {
  const [query, setQuery]               = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results, isLoading } = useSearchGuests(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 2, queryKey: ['searchGuests', debouncedQuery] } }
  );

  return (
    <AdminLayout>
      {/* Hero search area */}
      <div className="py-10 text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-800 tracking-tight mb-1">Find a Guest</h1>
        <p className="text-slate-500 text-sm">Search by name, phone, email, or passport number</p>

        <div className="relative max-w-xl mx-auto mt-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {isLoading
              ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              : <Search className="w-5 h-5 text-slate-400" />}
          </div>
          <input
            className="w-full h-14 rounded-2xl pl-12 pr-5 text-[15px] text-slate-700 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.68)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.82)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 28px rgba(99,102,241,0.09), 0 2px 8px rgba(0,0,0,0.05)",
            }}
            placeholder="Start typing..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto pb-12">
        {debouncedQuery.length <= 2 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)" }}>
              <Search className="w-7 h-7 text-indigo-300" />
            </div>
            <p className="text-sm font-medium">Type at least 3 characters to search</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-[210px] rounded-2xl" />)}
          </div>
        ) : results?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <Search className="w-7 h-7 text-indigo-200" />
            </div>
            <p className="text-base font-semibold text-slate-600 mb-1">No guests match "{query}"</p>
            <p className="text-sm">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results?.map((guest, index) => (
              <Link key={guest.id} href={`/bookings/${guest.bookingId}`} className="block outline-none">
                <div
                  className="rounded-2xl p-5 flex flex-col h-full cursor-pointer animate-in fade-in-0 slide-in-from-bottom-3 transition-all duration-200 hover:-translate-y-0.5 group"
                  style={{
                    animationDelay: `${index * 40}ms`,
                    animationFillMode: "both",
                    background: "rgba(255,255,255,0.62)",
                    backdropFilter: "blur(24px) saturate(160%)",
                    WebkitBackdropFilter: "blur(24px) saturate(160%)",
                    border: "1px solid rgba(255,255,255,0.80)",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 6px 24px rgba(99,102,241,0.07), 0 2px 6px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 1px 0 rgba(255,255,255,0.95) inset, 0 12px 32px rgba(99,102,241,0.14), 0 4px 10px rgba(0,0,0,0.07)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 1px 0 rgba(255,255,255,0.9) inset, 0 6px 24px rgba(99,102,241,0.07), 0 2px 6px rgba(0,0,0,0.04)";
                  }}
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0 ${getAvatarBg(guest.fullName)}`}
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.14)" }}
                    >
                      {getInitials(guest.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                        {guest.fullName}
                        {guest.isForeignNational && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: "rgba(167,139,250,0.15)", color: "#7c3aed", border: "1px solid rgba(167,139,250,0.25)" }}>
                            FRRO
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <Globe className="w-3 h-3 shrink-0" /> {guest.nationality}
                      </p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    {guest.phone && <p className="truncate">{guest.phone}</p>}
                    {guest.email && <p className="truncate">{guest.email}</p>}
                    {!guest.phone && !guest.email && <p className="italic text-slate-400">No contact info</p>}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between pt-3"
                    style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
                    <span className="font-mono text-[10px] font-medium px-2.5 py-1 rounded-lg uppercase tracking-wider text-slate-500"
                      style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.13)" }}>
                      {guest.idType.replace('_', ' ')}
                    </span>
                    <span className="text-indigo-500 text-xs font-semibold group-hover:text-indigo-700 transition-colors">
                      View Booking →
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
