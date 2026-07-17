import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBooking, getListBookingsQueryKey, getListRecentBookingsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Loader2, CalendarDays, User, Phone, Home, BedDouble, Users as UsersIcon } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function NewBooking() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    guestName: "",
    phone: "",
    email: "",
    roomNumber: "",
    numberOfGuests: 1,
    checkInDate: "",
    checkOutDate: "",
    notes: ""
  });

  const createBooking = useCreateBooking();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBooking.mutate({
      data: {
        ...formData,
        numberOfGuests: Number(formData.numberOfGuests),
        checkInDate: new Date(formData.checkInDate).toISOString(),
        checkOutDate: new Date(formData.checkOutDate).toISOString()
      }
    }, {
      onSuccess: (booking) => {
        toast({ title: "Booking created" });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRecentBookingsQueryKey() });
        setLocation(`/bookings/${booking.id}`);
      },
      onError: (error: any) => {
        toast({ 
          title: "Error creating booking", 
          description: error.message || "Please check your inputs",
          variant: "destructive"
        });
      }
    });
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link href="/bookings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to bookings
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-card rounded-xl border border-card-border shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-foreground">New Booking</h1>
                <p className="text-muted-foreground mt-1">Create a new guest reservation</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="guestName" className="text-sm font-medium">Primary Guest Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="guestName"
                        required
                        className="pl-10 h-11 bg-background"
                        value={formData.guestName}
                        onChange={handleInputChange("guestName")}
                        placeholder="e.g. Sarah Jenkins"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        className="pl-10 h-11 bg-background"
                        value={formData.phone}
                        onChange={handleInputChange("phone")}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomNumber" className="text-sm font-medium">Room Number</Label>
                    <div className="relative">
                      <BedDouble className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="roomNumber"
                        className="pl-10 h-11 bg-background"
                        value={formData.roomNumber}
                        onChange={handleInputChange("roomNumber")}
                        placeholder="e.g. 402"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfGuests" className="text-sm font-medium">Number of Guests</Label>
                    <div className="relative">
                      <UsersIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="numberOfGuests"
                        type="number"
                        min="1"
                        required
                        className="pl-10 h-11 bg-background"
                        value={formData.numberOfGuests}
                        onChange={handleInputChange("numberOfGuests")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkInDate" className="text-sm font-medium">Check-in Date</Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="checkInDate"
                        type="date"
                        required
                        className="pl-10 h-11 bg-background block"
                        value={formData.checkInDate}
                        onChange={handleInputChange("checkInDate")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate" className="text-sm font-medium">Check-out Date</Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="checkOutDate"
                        type="date"
                        required
                        className="pl-10 h-11 bg-background block"
                        value={formData.checkOutDate}
                        onChange={handleInputChange("checkOutDate")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    className="bg-background min-h-[100px] resize-none"
                    value={formData.notes}
                    onChange={handleInputChange("notes")}
                    placeholder="Any special requests or details..."
                  />
                </div>

                <div className="pt-6 flex items-center justify-end gap-3 border-t">
                  <Link href="/bookings">
                    <Button type="button" variant="outline" className="h-11 px-6">Cancel</Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="h-11 px-8 bg-primary hover:bg-primary/90 text-white"
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Booking
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-8 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Home className="w-5 h-5 text-indigo-500" />
              <h2 className="font-serif text-lg font-semibold text-indigo-950">Booking Preview</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-white/60 rounded-lg p-4 border border-white">
                <p className="text-xs text-indigo-600/70 font-medium uppercase tracking-wider mb-1">Guest</p>
                <p className="font-medium text-indigo-950">{formData.guestName || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 rounded-lg p-4 border border-white">
                  <p className="text-xs text-indigo-600/70 font-medium uppercase tracking-wider mb-1">Room</p>
                  <p className="font-medium text-indigo-950">{formData.roomNumber || "—"}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4 border border-white">
                  <p className="text-xs text-indigo-600/70 font-medium uppercase tracking-wider mb-1">Guests</p>
                  <p className="font-medium text-indigo-950">{formData.numberOfGuests || "—"}</p>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-4 border border-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-indigo-600/70 font-medium uppercase tracking-wider mb-1">Check-in</p>
                    <p className="font-medium text-indigo-950 text-sm">
                      {formData.checkInDate ? new Date(formData.checkInDate).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-600/70 font-medium uppercase tracking-wider mb-1">Check-out</p>
                    <p className="font-medium text-indigo-950 text-sm">
                      {formData.checkOutDate ? new Date(formData.checkOutDate).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-indigo-600/60 mt-6 text-center">
              A check-in link will be generated when this booking is saved.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
