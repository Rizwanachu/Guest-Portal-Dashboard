import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DoorOpen,
  Phone,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
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
    if (confirm("Are you sure you want to delete this booking? This cannot be undone.")) {
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
    const rows = booking.guests.map(g => [
      g.fullName, g.nationality, g.idType, g.idNumber || "N/A"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `guests_${booking.bookingRef}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isLoading || !booking) {
    return (
      <AdminLayout>
        <div className="space-y-8 animate-in fade-in">
          <div className="space-y-4 mb-8">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-1">
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-full min-h-[500px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const guestsSubmitted = booking.guests?.length || 0;
  const progressPercent = Math.min(100, Math.round((guestsSubmitted / booking.numberOfGuests) * 100));

  return (
    <AdminLayout>
      <div className="mb-8">
        <Link href="/bookings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Bookings
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Booking Ref • {booking.bookingRef}</p>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-3">{booking.guestName}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={booking.status} />
              <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                {new Date(booking.checkInDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })} &rarr; {new Date(booking.checkOutDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
              </span>
              <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                {guestsSubmitted}/{booking.numberOfGuests} guests
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 ml-auto">
            <Button variant="outline" className="border-border hover:bg-muted bg-card" onClick={exportCsv} disabled={booking.guests.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 bg-card" onClick={handleDelete} disabled={deleteBooking.isPending}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Link */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-card border-card-border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-base font-semibold">Reservation Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 text-center border-b">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Room</p>
                <p className="text-3xl font-serif font-bold text-primary">{booking.roomNumber || "TBD"}</p>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg"><Calendar className="w-4 h-4 text-muted-foreground" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="font-medium text-sm">{new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg"><Calendar className="w-4 h-4 text-muted-foreground" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Check-out</p>
                      <p className="font-medium text-sm">{new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{guestsSubmitted} of {booking.numberOfGuests} guests</span>
                    <span className="text-muted-foreground">checked in</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                {booking.phone && (
                  <div className="flex items-center gap-3 pt-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{booking.phone}</p>
                  </div>
                )}
                
                {booking.notes && (
                  <div className="pt-4 mt-2 border-t">
                    <p className="text-sm italic text-muted-foreground">"{booking.notes}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {checkinLink && (
            <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-indigo-950 font-semibold">Share with Guest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white border rounded-lg p-3 font-mono text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                  {checkinLink.url}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full bg-white hover:bg-gray-50 text-foreground" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4 mr-2" /> Copy Link
                  </Button>
                  <Button className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white border-none" onClick={() => window.open(checkinLink.whatsappUrl, '_blank')}>
                    <MessageCircle className="w-4 h-4 mr-2" /> Send via WhatsApp
                  </Button>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white border-none" onClick={() => window.open(checkinLink.smsUrl, '_blank')}>
                    <MessageSquare className="w-4 h-4 mr-2" /> Send via SMS
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Guest List */}
        <div className="lg:col-span-2">
          <Card className="h-full border-card-border shadow-sm">
            <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Guest Records</CardTitle>
              <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {guestsSubmitted}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {booking.guests.length > 0 ? (
                <div className="divide-y divide-border">
                  {booking.guests.map((guest, idx) => (
                    <div key={guest.id} className="p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0 ${getAvatarBg(guest.fullName)}`}>
                            {getInitials(guest.fullName)}
                          </div>
                          <div>
                            <h3 className="font-medium text-lg flex items-center gap-2 text-foreground">
                              {guest.fullName}
                              {guest.isForeignNational && (
                                <span className="bg-violet-100 text-violet-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">FRRO</span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Globe className="w-3.5 h-3.5" /> {guest.nationality}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg border border-border/50">
                        <div>
                          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Phone</p>
                          <p className="font-medium">{guest.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Email</p>
                          <p className="font-medium truncate" title={guest.email || ""}>{guest.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">ID Type</p>
                          <p className="font-medium uppercase">{guest.idType.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">ID Number</p>
                          <p className="font-mono font-medium">{guest.idNumber || "—"}</p>
                        </div>
                      </div>

                      {guest.isForeignNational && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-violet-50 p-4 rounded-lg border border-violet-100">
                          <div>
                            <p className="text-violet-600/70 text-xs font-medium uppercase tracking-wider mb-1">Passport No.</p>
                            <p className="font-mono font-medium text-violet-950">{guest.passportNumber || "—"}</p>
                          </div>
                          <div>
                            <p className="text-violet-600/70 text-xs font-medium uppercase tracking-wider mb-1">Passport Expiry</p>
                            <p className="font-medium text-violet-950">{guest.passportExpiry ? new Date(guest.passportExpiry).toLocaleDateString() : "—"}</p>
                          </div>
                          <div>
                            <p className="text-violet-600/70 text-xs font-medium uppercase tracking-wider mb-1">Visa No.</p>
                            <p className="font-mono font-medium text-violet-950">{guest.visaNumber || "—"}</p>
                          </div>
                          <div>
                            <p className="text-violet-600/70 text-xs font-medium uppercase tracking-wider mb-1">Visa Expiry</p>
                            <p className="font-medium text-violet-950">{guest.visaExpiry ? new Date(guest.visaExpiry).toLocaleDateString() : "—"}</p>
                          </div>
                          <div>
                            <p className="text-violet-600/70 text-xs font-medium uppercase tracking-wider mb-1">Visa Type</p>
                            <p className="font-medium text-violet-950">{guest.visaType || "—"}</p>
                          </div>
                          <div className="col-span-3">
                            <p className="text-violet-600/70 text-xs font-medium uppercase tracking-wider mb-1">Port of Entry</p>
                            <p className="font-medium text-violet-950">{guest.portOfEntry || "—"}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex gap-3">
                        {guest.idImageUrl && (
                          <a href={guest.idImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors">
                            <Download className="w-3.5 h-3.5" /> ID Document
                          </a>
                        )}
                        {guest.signatureUrl && (
                          <a href={guest.signatureUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors">
                            <Download className="w-3.5 h-3.5" /> Signature
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 flex flex-col items-center justify-center text-center">
                  <Users className="w-16 h-16 text-muted-foreground/20 mb-4" />
                  <p className="text-xl font-semibold text-foreground mb-1">No guests yet</p>
                  <p className="text-muted-foreground text-sm max-w-[250px]">Share the check-in link with the guest to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
