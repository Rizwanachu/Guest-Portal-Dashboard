import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  useGetBooking,
  useGetCheckinLink,
  useDeleteBooking,
  getListBookingsQueryKey,
  getGetBookingStatsQueryKey
} from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Link } from "wouter";
import {
  ArrowLeft,
  Copy,
  MessageCircle,
  MessageSquare,
  Download,
  Trash2,
  Calendar,
  Users,
  Phone,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
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
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: "rgba(251,191,36,0.14)", color: "#d97706", border: "1px solid rgba(251,191,36,0.28)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending
    </span>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useGetBooking(bookingId, {
    query: { enabled: !!bookingId, queryKey: ['booking', bookingId] }
  });
  const { data: checkinLink } = useGetCheckinLink(bookingId, {
    query: { enabled: !!bookingId, queryKey: ['checkinLink', bookingId] }
  });
  const deleteBooking = useDeleteBooking();

  const handleCopyLink = () => {
    if (checkinLink?.url) {
      navigator.clipboard.writeText(checkinLink.url);
      toast({ title: "Link copied to clipboard" });
    }
  };
  const handleDelete = () => {
    if (confirm("Delete this booking? This cannot be undone.")) {
      deleteBooking.mutate({ id: bookingId }, {
        onSuccess: () => {
          toast({ title: "Booking deleted" });
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
          setLocation("/bookings");
        }
      });
    }
  };
  const exportCsv = () => {
    if (!booking) return;
    const headers = ["Name", "Nationality", "ID Type", "ID Number"];
    const rows = booking.guests.map(g => [g.fullName, g.nationality, g.idType, g.idNumber || "N/A"]);
    const csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const a = document.createElement("a");
    a.setAttribute("href", encodeURI(csv));
    a.setAttribute("download", `guests_${booking.bookingRef}.csv`);
    document.body.appendChild(a); a.click(); a.remove();
  };

  if (isLoading || !booking) {
    return (
      <AdminLayout>
        <div className="space-y-6 animate-in fade-in">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-5"><Skeleton className="h-80 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
            <div className="lg:col-span-2"><Skeleton className="h-[500px] rounded-2xl" /></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const guestsSubmitted = booking.guests?.length || 0;
  const progressPercent = Math.min(100, Math.round((guestsSubmitted / booking.numberOfGuests) * 100));

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <Link href="/bookings" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors mb-5 gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Bookings
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold mb-1">
              Booking Ref · {booking.bookingRef}
            </p>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-3 tracking-tight">{booking.guestName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={booking.status} />
              <span className="text-xs font-medium text-slate-500 px-3 py-1 rounded-full"
                style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)" }}>
                {new Date(booking.checkInDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })} → {new Date(booking.checkOutDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
              </span>
              <span className="text-xs font-medium text-slate-500 px-3 py-1 rounded-full"
                style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)" }}>
                {guestsSubmitted}/{booking.numberOfGuests} guests
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={booking.guests.length === 0}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 px-4 py-2 rounded-xl transition-all disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(0,0,0,0.05)", backdropFilter: "blur(12px)" }}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteBooking.isPending}
              className="flex items-center gap-1.5 text-sm font-medium text-red-500 px-4 py-2 rounded-xl transition-all"
              style={{ background: "rgba(254,226,226,0.5)", border: "1px solid rgba(252,165,165,0.4)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset" }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="space-y-5 lg:col-span-1">
          {/* Reservation Details */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reservation Details</p>
            </div>

            {/* Room hero */}
            <div className="p-6 text-center" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold mb-1">Room</p>
              <p className="text-4xl font-serif font-bold text-indigo-600">{booking.roomNumber || "TBD"}</p>
            </div>

            <div className="p-5 space-y-4">
              {[
                { label: "Check-in", date: booking.checkInDate },
                { label: "Check-out", date: booking.checkOutDate },
              ].map(({ label, date }) => (
                <div key={label} className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                  <div className="p-2 rounded-xl" style={{ background: "rgba(99,102,241,0.09)", border: "1px solid rgba(99,102,241,0.15)" }}>
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="font-medium text-sm text-slate-700">
                      {new Date(date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-slate-700">{guestsSubmitted} of {booking.numberOfGuests} guests</span>
                  <span className="text-slate-400">checked in</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(99,102,241,0.1)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progressPercent}%`,
                      background: "linear-gradient(90deg, hsl(245,80%,60%), hsl(262,83%,58%))",
                      boxShadow: "0 0 8px rgba(99,102,241,0.4)",
                    }}
                  />
                </div>
              </div>

              {booking.phone && (
                <div className="flex items-center gap-3 pt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm text-slate-600">{booking.phone}</p>
                </div>
              )}
              {booking.notes && (
                <div className="pt-3 mt-1" style={{ borderTop: "1px solid rgba(99,102,241,0.07)" }}>
                  <p className="text-sm italic text-slate-400">"{booking.notes}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Share card */}
          {checkinLink && (
            <div className="rounded-2xl p-5 space-y-4"
              style={{
                background: "linear-gradient(145deg, rgba(99,102,241,0.10), rgba(167,139,250,0.08))",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(99,102,241,0.22)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.75) inset, 0 8px 24px rgba(99,102,241,0.09)",
              }}
            >
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Share with Guest</p>
              <div className="text-xs text-slate-500 font-mono px-3 py-2.5 rounded-xl overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.8)" }}>
                {checkinLink.url}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-slate-700 transition-all"
                  style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
                  <Copy className="w-4 h-4" /> Copy Link
                </button>
                <button onClick={() => window.open(checkinLink.whatsappUrl, '_blank')}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: "linear-gradient(145deg,#25D366,#1DA851)", boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 12px rgba(37,211,102,0.3)" }}>
                  <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                </button>
                <button onClick={() => window.open(checkinLink.smsUrl, '_blank')}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: "linear-gradient(145deg,#3b82f6,#2563eb)", boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 12px rgba(59,130,246,0.3)" }}>
                  <MessageSquare className="w-4 h-4" /> Send via SMS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Guest Records */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden h-full">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
              <p className="text-sm font-semibold text-slate-700">Guest Records</p>
              <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                style={{ background: "linear-gradient(145deg,hsl(245,80%,62%),hsl(262,83%,58%))" }}>
                {guestsSubmitted}
              </span>
            </div>

            {booking.guests.length > 0 ? (
              <div className="divide-y" style={{ "--divide-color": "rgba(99,102,241,0.07)" } as React.CSSProperties}>
                {booking.guests.map((guest) => (
                  <div key={guest.id} className="p-6 hover:bg-white/30 transition-colors" style={{ borderBottom: "1px solid rgba(99,102,241,0.07)" }}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${getAvatarBg(guest.fullName)}`}
                        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                        {getInitials(guest.fullName)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                          {guest.fullName}
                          {guest.isForeignNational && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(167,139,250,0.15)", color: "#7c3aed", border: "1px solid rgba(167,139,250,0.28)" }}>
                              FRRO
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3" /> {guest.nationality}
                        </p>
                      </div>
                    </div>

                    {/* ID grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm rounded-xl p-4 mb-3"
                      style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.10)" }}>
                      {[
                        { label: "Phone", val: guest.phone },
                        { label: "Email", val: guest.email },
                        { label: "ID Type", val: guest.idType?.replace('_', ' ').toUpperCase() },
                        { label: "ID Number", val: guest.idNumber, mono: true },
                      ].map(({ label, val, mono }) => (
                        <div key={label}>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                          <p className={`font-medium text-slate-700 truncate ${mono ? "font-mono" : ""}`}>{val || "—"}</p>
                        </div>
                      ))}
                    </div>

                    {/* FRRO */}
                    {guest.isForeignNational && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm rounded-xl p-4 mb-3"
                        style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.18)" }}>
                        {[
                          { label: "Passport No.", val: guest.passportNumber, mono: true },
                          { label: "Passport Expiry", val: guest.passportExpiry ? new Date(guest.passportExpiry).toLocaleDateString() : null },
                          { label: "Visa No.", val: guest.visaNumber, mono: true },
                          { label: "Visa Expiry", val: guest.visaExpiry ? new Date(guest.visaExpiry).toLocaleDateString() : null },
                          { label: "Visa Type", val: guest.visaType },
                          { label: "Port of Entry", val: guest.portOfEntry },
                        ].map(({ label, val, mono }) => (
                          <div key={label}>
                            <p className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">{label}</p>
                            <p className={`font-medium text-violet-900 ${mono ? "font-mono" : ""}`}>{val || "—"}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Document links */}
                    <div className="flex gap-2 mt-1">
                      {guest.idImageUrl && (
                        <a href={guest.idImageUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                          style={{ background: "rgba(99,102,241,0.09)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.2)" }}>
                          <Download className="w-3 h-3" /> ID Document
                        </a>
                      )}
                      {guest.signatureUrl && (
                        <a href={guest.signatureUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                          style={{ background: "rgba(99,102,241,0.09)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.2)" }}>
                          <Download className="w-3 h-3" /> Signature
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <Users className="w-14 h-14 mb-4" style={{ color: "rgba(99,102,241,0.2)" }} />
                <p className="text-lg font-semibold text-slate-700 mb-1">No guests yet</p>
                <p className="text-sm text-slate-400 max-w-[220px]">Share the check-in link with the guest to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
