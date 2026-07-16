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

export default function BookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useGetBooking(bookingId, { 
    query: { enabled: !!bookingId } 
  });
  
  const { data: checkinLink } = useGetCheckinLink(bookingId, {
    query: { enabled: !!bookingId }
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
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link href="/bookings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to bookings
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif text-foreground">{booking.guestName}</h1>
            <Badge variant={booking.status === 'completed' ? 'success' : 'warning'} className="text-sm">
              {booking.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={booking.guests.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Export Guest Data
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteBooking.isPending}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mt-1 font-mono">{booking.bookingRef}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Link */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <DoorOpen className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Room</p>
                  <p className="font-medium">{booking.roomNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Stay Dates</p>
                  <p className="font-medium">
                    {new Date(booking.checkInDate).toLocaleDateString()} &mdash; {new Date(booking.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Guests</p>
                  <p className="font-medium">{booking.guestsSubmitted || 0} / {booking.numberOfGuests} submitted</p>
                </div>
              </div>
              {booking.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Contact</p>
                    <p className="font-medium">{booking.phone}</p>
                  </div>
                </div>
              )}
              {booking.notes && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs mb-1">Notes</p>
                  <p className="text-sm italic">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {checkinLink && (
            <Card className="bg-secondary/10 border-secondary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-secondary-foreground">Share Check-in Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={checkinLink.url} 
                    className="bg-white font-mono text-xs"
                  />
                  <Button variant="secondary" size="icon" onClick={handleCopyLink} className="shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-[#25D366] text-white border-transparent hover:bg-[#128C7E] hover:text-white"
                    onClick={() => window.open(checkinLink.whatsappUrl, '_blank')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-blue-500 text-white border-transparent hover:bg-blue-600 hover:text-white"
                    onClick={() => window.open(checkinLink.smsUrl, '_blank')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> SMS
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Guest List */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Guest Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {booking.guests.length > 0 ? (
                <div className="divide-y">
                  {booking.guests.map((guest, idx) => (
                    <div key={guest.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-serif font-medium text-lg flex items-center gap-2">
                            {idx + 1}. {guest.fullName}
                            {guest.isForeignNational && (
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">FRRO</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Globe className="w-3 h-3" /> {guest.nationality}
                          </p>
                        </div>
                        <Badge variant="outline" className="uppercase font-mono text-xs">
                          {guest.idType.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Phone</p>
                          <p>{guest.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Email</p>
                          <p className="truncate" title={guest.email}>{guest.email || "—"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs mb-1">ID Number</p>
                          <p className="font-mono">{guest.idNumber || "—"}</p>
                        </div>
                      </div>

                      {guest.isForeignNational && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30">
                          <div>
                            <p className="text-purple-600/70 dark:text-purple-400/70 text-xs mb-1">Visa No.</p>
                            <p className="font-mono">{guest.visaNumber || "—"}</p>
                          </div>
                          <div>
                            <p className="text-purple-600/70 dark:text-purple-400/70 text-xs mb-1">Visa Expiry</p>
                            <p>{guest.visaExpiry ? new Date(guest.visaExpiry).toLocaleDateString() : "—"}</p>
                          </div>
                          <div>
                            <p className="text-purple-600/70 dark:text-purple-400/70 text-xs mb-1">Passport No.</p>
                            <p className="font-mono">{guest.passportNumber || "—"}</p>
                          </div>
                          <div>
                            <p className="text-purple-600/70 dark:text-purple-400/70 text-xs mb-1">Passport Expiry</p>
                            <p>{guest.passportExpiry ? new Date(guest.passportExpiry).toLocaleDateString() : "—"}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex gap-4">
                        {guest.idImageUrl && (
                          <a href={guest.idImageUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Download className="w-3 h-3" /> View ID Document
                          </a>
                        )}
                        {guest.signatureUrl && (
                          <a href={guest.signatureUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Download className="w-3 h-3" /> View Signature
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-lg font-medium text-foreground">No guests submitted yet</p>
                  <p className="mt-1">Share the check-in link with the guest to begin.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
