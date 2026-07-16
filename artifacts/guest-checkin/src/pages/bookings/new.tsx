import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBooking, getListBookingsQueryKey, getListRecentBookingsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function NewBooking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createBooking = useCreateBooking();
  
  const [formData, setFormData] = useState({
    guestName: "",
    phone: "",
    roomNumber: "",
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: 1,
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBooking.mutate({
      data: {
        ...formData,
        numberOfGuests: Number(formData.numberOfGuests)
      }
    }, {
      onSuccess: (booking) => {
        toast({
          title: "Booking created",
          description: `Booking ${booking.bookingRef} has been successfully created.`,
        });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRecentBookingsQueryKey() });
        setLocation(`/bookings/${booking.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create booking. Please check your inputs.",
          variant: "destructive"
        });
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link href="/bookings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to bookings
        </Link>
        <h1 className="text-3xl font-serif text-foreground">New Booking</h1>
        <p className="text-muted-foreground mt-1">Create a new booking and generate a check-in link.</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Primary Guest Name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="guestName" 
                    name="guestName" 
                    required 
                    value={formData.guestName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +1 234 567 8900"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">Room Number <span className="text-destructive">*</span></Label>
                  <Input 
                    id="roomNumber" 
                    name="roomNumber" 
                    required 
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfGuests">Number of Guests <span className="text-destructive">*</span></Label>
                  <Input 
                    id="numberOfGuests" 
                    name="numberOfGuests" 
                    type="number" 
                    min="1" 
                    required 
                    value={formData.numberOfGuests}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkInDate">Check-in Date <span className="text-destructive">*</span></Label>
                  <Input 
                    id="checkInDate" 
                    name="checkInDate" 
                    type="date" 
                    required 
                    value={formData.checkInDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOutDate">Check-out Date <span className="text-destructive">*</span></Label>
                  <Input 
                    id="checkOutDate" 
                    name="checkOutDate" 
                    type="date" 
                    required 
                    value={formData.checkOutDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any special requests or notes for staff..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href="/bookings">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={createBooking.isPending}>
                  {createBooking.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    "Create Booking"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
