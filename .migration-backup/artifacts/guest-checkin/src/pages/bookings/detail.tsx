import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetBooking,
  useGetCheckinLink,
  useDeleteBooking,
  useUpdateBooking,
  getListBookingsQueryKey,
  getGetBookingStatsQueryKey,
} from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Link } from "wouter";
import {
  ArrowLeft, Copy, MessageCircle, MessageSquare, Download, Trash2,
  Calendar, Users, Phone, Globe, Edit3, X, Check, Loader2,
  Clock, CheckCircle2, History, StickyNote, Copy as CopyIcon,
  ChevronRight, MoreHorizontal, UserCheck, Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}
function getAvatarBg(name: string) {
  const colors = ["bg-indigo-400","bg-violet-400","bg-emerald-400","bg-amber-400","bg-rose-400","bg-teal-400","bg-sky-400","bg-orange-400"];
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

function StatusPill({ status }: { status: string }) {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: "rgba(52,211,153,0.14)", color: "#059669", border: "1px solid rgba(52,211,153,0.28)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Completed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: "rgba(251,191,36,0.14)", color: "#d97706", border: "1px solid rgba(251,191,36,0.28)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Timeline ────────────────────────────────────────────────────────────────

function Timeline({ booking }: { booking: any }) {
  const events = [
    {
      icon: <Calendar className="w-3.5 h-3.5 text-indigo-500" />,
      label: "Booking created",
      detail: `Ref ${booking.bookingRef}`,
      time: booking.createdAt,
      color: "rgba(99,102,241,0.15)",
    },
    ...(booking.guests ?? []).map((g: any, i: number) => ({
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-500" />,
      label: `Guest ${i + 1} checked in`,
      detail: g.fullName,
      time: g.createdAt,
      color: "rgba(52,211,153,0.15)",
    })),
    ...(booking.status === "completed"
      ? [{
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />,
          label: "Booking completed",
          detail: `All ${booking.numberOfGuests} guest${booking.numberOfGuests !== 1 ? "s" : ""} checked in`,
          time: booking.updatedAt ?? booking.createdAt,
          color: "rgba(20,184,166,0.15)",
        }]
      : []),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <div className="space-y-0">
      {events.map((ev, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i }}
          className="flex gap-3 relative"
        >
          {/* Line */}
          {i < events.length - 1 && (
            <div className="absolute left-[18px] top-8 bottom-0 w-px" style={{ background: "rgba(99,102,241,0.12)" }} />
          )}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: ev.color, border: "1px solid rgba(255,255,255,0.8)" }}>
            {ev.icon}
          </div>
          <div className="pb-4 flex-1">
            <p className="text-sm font-medium text-slate-700">{ev.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{ev.detail}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">{formatDateTime(ev.time)}</p>
          </div>
        </motion.div>
      ))}
      {events.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">No timeline events yet</p>
      )}
    </div>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditForm({ booking, onSave, onCancel }: { booking: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    guestName: booking.guestName ?? "",
    phone: booking.phone ?? "",
    roomNumber: booking.roomNumber ?? "",
    numberOfGuests: booking.numberOfGuests ?? 1,
    checkInDate: booking.checkInDate?.slice(0, 10) ?? "",
    checkOutDate: booking.checkOutDate?.slice(0, 10) ?? "",
    status: booking.status ?? "pending",
    notes: booking.notes ?? "",
  });

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Guest Name</Label>
          <Input value={form.guestName} onChange={set("guestName")} className="glass-input h-9" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone</Label>
          <Input value={form.phone} onChange={set("phone")} className="glass-input h-9" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Room</Label>
          <Input value={form.roomNumber} onChange={set("roomNumber")} className="glass-input h-9" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Guests</Label>
          <Input type="number" min="1" value={form.numberOfGuests} onChange={set("numberOfGuests")} className="glass-input h-9" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Check-in</Label>
          <Input type="date" value={form.checkInDate} onChange={set("checkInDate")} className="glass-input h-9" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Check-out</Label>
          <Input type="date" value={form.checkOutDate} onChange={set("checkOutDate")} className="glass-input h-9" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</Label>
          <select value={form.status} onChange={set("status")}
            className="w-full h-9 rounded-xl px-3 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.75)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset" }}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</Label>
          <Textarea value={form.notes} onChange={set("notes")} className="glass-input resize-none min-h-[80px] text-sm" placeholder="Add notes…" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 transition-all"
          style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button onClick={() => onSave(form)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 12px rgba(99,102,241,0.3)" }}>
          <Check className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function BookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"guests" | "timeline" | "notes">("guests");

  const { data: booking, isLoading } = useGetBooking(bookingId, {
    query: { enabled: !!bookingId, queryKey: ["booking", bookingId] },
  });
  const { data: checkinLink } = useGetCheckinLink(bookingId, {
    query: { enabled: !!bookingId, queryKey: ["checkinLink", bookingId] },
  });
  const deleteBooking = useDeleteBooking();
  const updateBooking = useUpdateBooking();

  const handleCopyLink = () => {
    if (checkinLink?.url) {
      navigator.clipboard.writeText(checkinLink.url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const handleDelete = () => {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    deleteBooking.mutate({ id: bookingId }, {
      onSuccess: () => {
        toast({ title: "Booking deleted" });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
        setLocation("/bookings");
      },
    });
  };

  const handleSave = (formData: any) => {
    updateBooking.mutate(
      {
        id: bookingId,
        data: {
          ...formData,
          numberOfGuests: Number(formData.numberOfGuests),
          checkInDate: formData.checkInDate ? new Date(formData.checkInDate).toISOString() : undefined,
          checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Booking updated" });
          queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          setIsEditing(false);
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleDuplicate = async () => {
    const res = await fetch(`/api/bookings/${bookingId}/duplicate`, { method: "POST" });
    if (res.ok) {
      const dup = await res.json();
      queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      toast({ title: "Booking duplicated", description: `New ref: ${dup.bookingRef}` });
      setLocation(`/bookings/${dup.id}`);
    }
  };

  const exportCsv = () => {
    if (!booking) return;
    const headers = ["Name", "Nationality", "ID Type", "ID Number", "Phone", "Email"];
    const rows = booking.guests.map((g) => [g.fullName, g.nationality, g.idType, g.idNumber ?? "N/A", g.phone ?? "", g.email ?? ""]);
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `guests_${booking.bookingRef}.csv`;
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
  const nights = Math.max(1, Math.round(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
        <Link href="/bookings" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors mb-5 gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Bookings
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold mb-1">
              Booking Ref · {booking.bookingRef}
            </p>
            {isEditing ? (
              <p className="text-xl font-serif font-bold text-foreground tracking-tight text-slate-500 italic">Editing booking…</p>
            ) : (
              <h1 className="text-3xl font-serif font-bold text-foreground mb-3 tracking-tight">{booking.guestName}</h1>
            )}
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={booking.status} />
                <span className="text-xs font-medium text-slate-500 px-3 py-1 rounded-full"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)" }}>
                  {new Date(booking.checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {new Date(booking.checkOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="text-xs font-medium text-slate-500 px-3 py-1 rounded-full"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)" }}>
                  {nights} night{nights !== 1 ? "s" : ""}
                </span>
                <span className="text-xs font-medium text-slate-500 px-3 py-1 rounded-full"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)" }}>
                  {guestsSubmitted}/{booking.numberOfGuests} guests
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isEditing && (
              <>
                <button onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 px-4 py-2 rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(0,0,0,0.05)", backdropFilter: "blur(12px)" }}>
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                <button onClick={handleDuplicate}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 px-4 py-2 rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(0,0,0,0.05)", backdropFilter: "blur(12px)" }}>
                  <CopyIcon className="w-4 h-4" /> Duplicate
                </button>
                <button onClick={exportCsv} disabled={booking.guests.length === 0}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 px-4 py-2 rounded-xl transition-all disabled:opacity-40"
                  style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(0,0,0,0.05)", backdropFilter: "blur(12px)" }}>
                  <Download className="w-4 h-4" /> Export
                </button>
                <button onClick={handleDelete} disabled={deleteBooking.isPending}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-500 px-4 py-2 rounded-xl transition-all"
                  style={{ background: "rgba(254,226,226,0.5)", border: "1px solid rgba(252,165,165,0.4)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset" }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Edit Form (full width) ── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-700">Edit Booking Details</h2>
            </div>
            <EditForm
              booking={booking}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left Column ── */}
        <div className="space-y-5 lg:col-span-1">
          {/* Reservation Details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reservation</p>
            </div>

            {/* Room hero */}
            <div className="p-5 text-center" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold mb-1">Room</p>
              <p className="text-5xl font-serif font-bold text-indigo-600">{booking.roomNumber || "TBD"}</p>
              <p className="text-xs text-slate-400 mt-1">{nights} night stay</p>
            </div>

            <div className="p-5 space-y-4">
              {[
                { label: "Check-in", date: booking.checkInDate, icon: <Calendar className="w-4 h-4 text-indigo-400" /> },
                { label: "Check-out", date: booking.checkOutDate, icon: <Calendar className="w-4 h-4 text-rose-400" /> },
              ].map(({ label, date, icon }) => (
                <div key={label} className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                  <div className="p-2 rounded-xl" style={{ background: "rgba(99,102,241,0.09)", border: "1px solid rgba(99,102,241,0.15)" }}>{icon}</div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="font-medium text-sm text-slate-700">{formatDate(date)}</p>
                  </div>
                </div>
              ))}

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-slate-700">{guestsSubmitted} of {booking.numberOfGuests} guests</span>
                  <span className="text-slate-400">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(99,102,241,0.1)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, hsl(245,80%,60%), hsl(262,83%,58%))", boxShadow: "0 0 8px rgba(99,102,241,0.4)" }}
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
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <StickyNote className="w-3 h-3 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Notes</p>
                  </div>
                  <p className="text-sm text-slate-500 italic leading-relaxed">"{booking.notes}"</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Share card */}
          {checkinLink && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: "linear-gradient(145deg, rgba(99,102,241,0.10), rgba(167,139,250,0.08))",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(99,102,241,0.22)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.75) inset, 0 8px 24px rgba(99,102,241,0.09)",
              }}
            >
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Share Check-in Link</p>
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
                <button onClick={() => window.open(checkinLink.whatsappUrl, "_blank")}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: "linear-gradient(145deg,#25D366,#1DA851)", boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 12px rgba(37,211,102,0.3)" }}>
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button onClick={() => window.open(checkinLink.smsUrl, "_blank")}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: "linear-gradient(145deg,#3b82f6,#2563eb)", boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 12px rgba(59,130,246,0.3)" }}>
                  <MessageSquare className="w-4 h-4" /> SMS
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Right Column ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center gap-0" style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
              {[
                { key: "guests", label: `Guests (${guestsSubmitted})`, icon: <Users className="w-3.5 h-3.5" /> },
                { key: "timeline", label: "Timeline", icon: <History className="w-3.5 h-3.5" /> },
                { key: "notes", label: "Notes", icon: <StickyNote className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className="flex items-center gap-1.5 px-5 py-4 text-sm font-medium transition-all relative"
                  style={{
                    color: activeTab === tab.key ? "hsl(245,80%,50%)" : "#94a3b8",
                    borderBottom: activeTab === tab.key ? "2px solid hsl(245,80%,55%)" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "guests" && (
                <motion.div key="guests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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
                          <div className="grid grid-cols-2 gap-3 text-sm rounded-xl p-4 mb-3"
                            style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.10)" }}>
                            {[
                              { label: "Phone", val: guest.phone },
                              { label: "Email", val: guest.email },
                              { label: "ID Type", val: guest.idType?.replace("_", " ").toUpperCase() },
                              { label: "ID Number", val: guest.idNumber, mono: true },
                            ].map(({ label, val, mono }) => (
                              <div key={label}>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                                <p className={`font-medium text-slate-700 truncate ${mono ? "font-mono" : ""}`}>{val || "—"}</p>
                              </div>
                            ))}
                          </div>
                          {guest.isForeignNational && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm rounded-xl p-4 mb-3"
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
                </motion.div>
              )}

              {activeTab === "timeline" && (
                <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="p-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Booking History</h3>
                  <Timeline booking={booking} />
                </motion.div>
              )}

              {activeTab === "notes" && (
                <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="p-6">
                  {booking.notes ? (
                    <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Booking Notes</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{booking.notes}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 mb-4">
                      <StickyNote className="w-8 h-8 mx-auto mb-2 text-indigo-200" />
                      <p className="text-sm text-slate-400">No notes for this booking</p>
                    </div>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {booking.notes ? "Edit notes" : "Add notes"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
