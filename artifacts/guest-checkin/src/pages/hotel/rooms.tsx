import { AdminLayout } from "@/components/layout/AdminLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Plus, BedDouble, Trash2, Edit3, X, Check, Loader2, Settings, Layers, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type RoomType = { id: number; name: string; description: string; basePricePerNight: number; maxOccupancy: number; bedType: string; amenities: string[]; isActive: boolean };
type Room = { id: number; number: string; floor: number; roomTypeId: number | null; status: string; notes: string; roomTypeName?: string; bedType?: string; basePricePerNight?: number };

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  available:    { label: "Available",    bg: "rgba(52,211,153,0.12)",  color: "#059669", dot: "bg-emerald-500" },
  occupied:     { label: "Occupied",     bg: "rgba(99,102,241,0.12)", color: "#4f46e5", dot: "bg-indigo-500" },
  maintenance:  { label: "Maintenance",  bg: "rgba(251,191,36,0.12)", color: "#d97706", dot: "bg-amber-400" },
  out_of_order: { label: "Out of Order", bg: "rgba(239,68,68,0.10)",  color: "#dc2626", dot: "bg-red-500" },
};
const BED_TYPES = ["single","double","twin","queen","king","suite"];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.available!;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
}

function RoomStatusMenu({ roomId, currentStatus, onUpdate }: { roomId: number; currentStatus: string; onUpdate: (id: number, status: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1">
        <StatusBadge status={currentStatus} />
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute top-7 left-0 z-50 w-36 rounded-xl overflow-hidden shadow-xl"
            style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(99,102,241,0.15)" }}>
            {Object.entries(STATUS_STYLES).map(([s, st]) => (
              <button key={s} onClick={() => { onUpdate(roomId, s); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-indigo-50 transition-colors"
                style={{ color: st.color }}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"rooms" | "types">("rooms");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [editType, setEditType] = useState<RoomType | null>(null);

  const [roomForm, setRoomForm] = useState({ number: "", floor: "1", roomTypeId: "", status: "available", notes: "" });
  const [typeForm, setTypeForm] = useState({ name: "", description: "", basePricePerNight: "", maxOccupancy: "2", bedType: "double", amenities: "" });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: () => fetch("/api/rooms", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user?.hotelId,
  });
  const { data: roomTypes = [], isLoading: typesLoading } = useQuery<RoomType[]>({
    queryKey: ["room-types"],
    queryFn: () => fetch("/api/room-types", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user?.hotelId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["room-types"] });
  }

  async function saveRoom() {
    const url = editRoom ? `/api/rooms/${editRoom.id}` : "/api/rooms";
    const method = editRoom ? "PATCH" : "POST";
    const body = { ...roomForm, floor: parseInt(roomForm.floor), roomTypeId: roomForm.roomTypeId ? parseInt(roomForm.roomTypeId) : null };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
    if (res.ok) { invalidate(); setShowAddRoom(false); setEditRoom(null); setRoomForm({ number: "", floor: "1", roomTypeId: "", status: "available", notes: "" }); toast({ title: editRoom ? "Room updated" : "Room added" }); }
    else toast({ title: "Error", variant: "destructive" });
  }

  async function saveType() {
    const url = editType ? `/api/room-types/${editType.id}` : "/api/room-types";
    const method = editType ? "PATCH" : "POST";
    const amenities = typeForm.amenities.split(",").map((a) => a.trim()).filter(Boolean);
    const body = { ...typeForm, basePricePerNight: parseFloat(typeForm.basePricePerNight), maxOccupancy: parseInt(typeForm.maxOccupancy), amenities };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
    if (res.ok) { invalidate(); setShowAddType(false); setEditType(null); setTypeForm({ name: "", description: "", basePricePerNight: "", maxOccupancy: "2", bedType: "double", amenities: "" }); toast({ title: editType ? "Room type updated" : "Room type added" }); }
    else toast({ title: "Error", variant: "destructive" });
  }

  async function updateRoomStatus(id: number, status: string) {
    await fetch(`/api/rooms/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status }) });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    toast({ title: `Room marked ${status}` });
  }

  async function deleteRoom(id: number) {
    if (!confirm("Delete this room?")) return;
    await fetch(`/api/rooms/${id}`, { method: "DELETE", credentials: "include" });
    invalidate(); toast({ title: "Room deleted" });
  }

  async function deleteType(id: number) {
    if (!confirm("Delete this room type?")) return;
    await fetch(`/api/room-types/${id}`, { method: "DELETE", credentials: "include" });
    invalidate(); toast({ title: "Room type deleted" });
  }

  const inputCls = "glass-input h-9 text-sm";
  const selectCls = "w-full h-9 rounded-xl px-3 text-sm outline-none appearance-none";
  const selectSt = { background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.75)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset" };

  const floorGroups = rooms.reduce<Record<number, Room[]>>((acc, r) => { (acc[r.floor] = acc[r.floor] ?? []).push(r); return acc; }, {});
  const statusSummary = Object.entries(STATUS_STYLES).map(([s, st]) => ({ ...st, status: s, count: rooms.filter((r) => r.status === s).length }));

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Rooms</h1>
          <p className="text-slate-500 text-sm mt-0.5">{rooms.length} rooms · {roomTypes.length} types</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowAddType(true); setEditType(null); setTypeForm({ name: "", description: "", basePricePerNight: "", maxOccupancy: "2", bedType: "double", amenities: "" }); }}
            className="rounded-xl text-sm font-medium glass-card border-white/60">
            <Layers className="w-4 h-4 mr-1.5" />Room Type
          </Button>
          <button onClick={() => { setShowAddRoom(true); setEditRoom(null); setRoomForm({ number: "", floor: "1", roomTypeId: "", status: "available", notes: "" }); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
            <Plus className="w-4 h-4" />Add Room
          </button>
        </div>
      </motion.div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statusSummary.map((s, i) => (
          <motion.div key={s.status} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
            className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}><span className={`w-3 h-3 rounded-full ${s.dot}`} /></div>
            <div>
              <p className="text-2xl font-bold font-serif" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 glass-card rounded-2xl p-1 w-fit">
        {(["rooms", "types"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={activeTab === t ? { background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", color: "white", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" } : { color: "#64748b" }}>
            {t === "rooms" ? "Rooms" : "Room Types"}
          </button>
        ))}
      </div>

      {/* Rooms tab */}
      {activeTab === "rooms" && (
        <div className="space-y-4">
          {roomsLoading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />) :
            Object.keys(floorGroups).length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <BedDouble className="w-12 h-12 mx-auto mb-3 text-indigo-200" />
                <p className="font-medium text-slate-600 mb-1">No rooms yet</p>
                <p className="text-sm text-slate-400">Click "Add Room" to get started</p>
              </div>
            ) : (
              Object.entries(floorGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, floorRooms]) => (
                <motion.div key={floor} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Floor {floor}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5" }}>{floorRooms.length} rooms</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y" style={{ "--tw-divide-opacity": "1", borderColor: "rgba(99,102,241,0.06)" } as React.CSSProperties}>
                    {floorRooms.map((room) => (
                      <div key={room.id} className="p-4 hover:bg-white/30 transition-colors group">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-2xl font-serif font-bold text-slate-800">{room.number}</span>
                            {room.roomTypeName && <p className="text-xs text-slate-400 mt-0.5">{room.roomTypeName}</p>}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditRoom(room); setShowAddRoom(true); setRoomForm({ number: room.number, floor: String(room.floor), roomTypeId: String(room.roomTypeId ?? ""), status: room.status, notes: room.notes ?? "" }); }}
                              className="p-1.5 rounded-lg hover:bg-indigo-100 transition-colors"><Edit3 className="w-3.5 h-3.5 text-slate-500" /></button>
                            <button onClick={() => deleteRoom(room.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                          </div>
                        </div>
                        <RoomStatusMenu roomId={room.id} currentStatus={room.status} onUpdate={updateRoomStatus} />
                        {room.notes && <p className="text-xs text-slate-400 mt-2 truncate">{room.notes}</p>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
        </div>
      )}

      {/* Room types tab */}
      {activeTab === "types" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {typesLoading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />) :
            roomTypes.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center col-span-3">
                <Layers className="w-10 h-10 mx-auto mb-3 text-indigo-200" />
                <p className="font-medium text-slate-600 mb-1">No room types</p>
                <p className="text-sm text-slate-400">Add room types to categorize your rooms</p>
              </div>
            ) : (
              roomTypes.map((type, i) => (
                <motion.div key={type.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  className="glass-card rounded-2xl p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{type.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{type.bedType} bed · max {type.maxOccupancy} guests</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditType(type); setShowAddType(true); setTypeForm({ name: type.name, description: type.description ?? "", basePricePerNight: String(type.basePricePerNight), maxOccupancy: String(type.maxOccupancy), bedType: type.bedType, amenities: (type.amenities ?? []).join(", ") }); }}
                        className="p-1.5 rounded-lg hover:bg-indigo-100"><Edit3 className="w-3.5 h-3.5 text-slate-500" /></button>
                      <button onClick={() => deleteType(type.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </div>
                  {type.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{type.description}</p>}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-indigo-600">₹{type.basePricePerNight.toLocaleString()}<span className="text-xs font-normal text-slate-400">/night</span></p>
                    <div className="flex flex-wrap gap-1">
                      {(type.amenities ?? []).slice(0, 3).map((a) => (
                        <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5" }}>{a}</span>
                      ))}
                      {(type.amenities ?? []).length > 3 && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5" }}>+{(type.amenities ?? []).length - 3}</span>}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
        </div>
      )}

      {/* ── Add/Edit Room Modal ── */}
      <AnimatePresence>
        {showAddRoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }} className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(24px)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-slate-800">{editRoom ? "Edit Room" : "Add Room"}</h3>
                <button onClick={() => { setShowAddRoom(false); setEditRoom(null); }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Room No. *</Label>
                    <Input value={roomForm.number} onChange={(e) => setRoomForm((p) => ({ ...p, number: e.target.value }))} className={inputCls} placeholder="101" /></div>
                  <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Floor</Label>
                    <Input type="number" value={roomForm.floor} onChange={(e) => setRoomForm((p) => ({ ...p, floor: e.target.value }))} className={inputCls} /></div>
                </div>
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Room Type</Label>
                  <select value={roomForm.roomTypeId} onChange={(e) => setRoomForm((p) => ({ ...p, roomTypeId: e.target.value }))} className={selectCls} style={selectSt}>
                    <option value="">Select type…</option>
                    {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select></div>
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</Label>
                  <select value={roomForm.status} onChange={(e) => setRoomForm((p) => ({ ...p, status: e.target.value }))} className={selectCls} style={selectSt}>
                    {Object.entries(STATUS_STYLES).map(([s, st]) => <option key={s} value={s}>{st.label}</option>)}
                  </select></div>
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Notes</Label>
                  <Input value={roomForm.notes} onChange={(e) => setRoomForm((p) => ({ ...p, notes: e.target.value }))} className={inputCls} placeholder="e.g. Sea view, adjoining rooms" /></div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => { setShowAddRoom(false); setEditRoom(null); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.8)" }}>Cancel</button>
                <button onClick={saveRoom} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))" }}>
                  {editRoom ? "Save Changes" : "Add Room"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add/Edit Room Type Modal ── */}
      <AnimatePresence>
        {showAddType && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }} className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(24px)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-slate-800">{editType ? "Edit Room Type" : "Add Room Type"}</h3>
                <button onClick={() => { setShowAddType(false); setEditType(null); }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="space-y-3">
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Type Name *</Label>
                  <Input value={typeForm.name} onChange={(e) => setTypeForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Deluxe Suite" /></div>
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</Label>
                  <Input value={typeForm.description} onChange={(e) => setTypeForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} placeholder="Spacious room with city view" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Price / Night</Label>
                    <Input type="number" value={typeForm.basePricePerNight} onChange={(e) => setTypeForm((p) => ({ ...p, basePricePerNight: e.target.value }))} className={inputCls} placeholder="5000" /></div>
                  <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Max Guests</Label>
                    <Input type="number" value={typeForm.maxOccupancy} onChange={(e) => setTypeForm((p) => ({ ...p, maxOccupancy: e.target.value }))} className={inputCls} /></div>
                </div>
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Bed Type</Label>
                  <select value={typeForm.bedType} onChange={(e) => setTypeForm((p) => ({ ...p, bedType: e.target.value }))} className={selectCls} style={selectSt}>
                    {BED_TYPES.map((b) => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                  </select></div>
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Amenities <span className="font-normal text-slate-400">(comma-separated)</span></Label>
                  <Input value={typeForm.amenities} onChange={(e) => setTypeForm((p) => ({ ...p, amenities: e.target.value }))} className={inputCls} placeholder="WiFi, AC, TV, Mini Bar" /></div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => { setShowAddType(false); setEditType(null); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.8)" }}>Cancel</button>
                <button onClick={saveType} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))" }}>
                  {editType ? "Save Changes" : "Add Type"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
