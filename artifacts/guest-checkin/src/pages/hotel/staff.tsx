import { AdminLayout } from "@/components/layout/AdminLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Trash2, Edit3, UserCheck, Mail, Phone, Shield, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type StaffMember = {
  staffId: number; userId: number; name: string; email: string; phone: string | null;
  staffRole: string; userRole: string; department: string | null; isActive: boolean;
  lastLoginAt: string | null; joinedAt: string;
};

const STAFF_ROLES = ["manager","receptionist","housekeeping","security","other"];
const USER_ROLES = ["admin","staff"];

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  admin:        { bg: "rgba(99,102,241,0.12)",  color: "#4f46e5",  label: "Admin" },
  staff:        { bg: "rgba(100,116,139,0.12)", color: "#475569",  label: "Staff" },
  super_admin:  { bg: "rgba(239,68,68,0.10)",   color: "#dc2626",  label: "Super Admin" },
  manager:      { bg: "rgba(52,211,153,0.12)",  color: "#059669",  label: "Manager" },
  receptionist: { bg: "rgba(99,102,241,0.10)",  color: "#4f46e5",  label: "Receptionist" },
  housekeeping: { bg: "rgba(251,191,36,0.12)",  color: "#d97706",  label: "Housekeeping" },
  security:     { bg: "rgba(239,68,68,0.10)",   color: "#dc2626",  label: "Security" },
  other:        { bg: "rgba(100,116,139,0.10)", color: "#475569",  label: "Other" },
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.other!;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}
function getAvatarBg(name: string) {
  const colors = ["bg-indigo-400","bg-violet-400","bg-emerald-400","bg-amber-400","bg-rose-400","bg-teal-400"];
  return colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
}

export default function StaffPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", staffRole: "receptionist", userRole: "staff", department: "" });

  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff"],
    queryFn: () => fetch("/api/staff", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user?.hotelId,
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  async function addStaff() {
    if (!form.name || !form.email) { toast({ title: "Name and email are required", variant: "destructive" }); return; }
    const res = await fetch("/api/staff", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ name: form.name, email: form.email, role: form.staffRole, userRole: form.userRole, department: form.department || null }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setShowAdd(false);
      setForm({ name: "", email: "", staffRole: "receptionist", userRole: "staff", department: "" });
      toast({ title: "Staff member added", description: "An invitation email has been sent." });
    } else {
      const err = await res.json();
      toast({ title: err.error ?? "Failed to add staff", variant: "destructive" });
    }
  }

  async function deactivate(staffId: number, name: string) {
    if (!confirm(`Remove ${name} from staff?`)) return;
    await fetch(`/api/staff/${staffId}`, { method: "DELETE", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: ["staff"] });
    toast({ title: "Staff member removed" });
  }

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.department ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = "glass-input h-9 text-sm";
  const selectCls = "w-full h-9 rounded-xl px-3 text-sm outline-none appearance-none";
  const selectSt = { background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.75)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset" };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Staff</h1>
          <p className="text-slate-500 text-sm mt-0.5">{staff.filter((s) => s.isActive).length} active members</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
          <Plus className="w-4 h-4" />Add Staff
        </button>
      </motion.div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…"
          className="pl-10 h-9 glass-input rounded-xl text-sm" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-indigo-200" />
          <p className="font-medium text-slate-600 mb-1">{search ? "No staff found" : "No staff yet"}</p>
          <p className="text-sm text-slate-400">{search ? "Try a different search" : "Add staff members to get started"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <motion.div key={s.staffId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
              className={`glass-card rounded-2xl p-5 group relative ${!s.isActive ? "opacity-50" : ""}`}>
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => deactivate(s.staffId, s.name)} className="p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${getAvatarBg(s.name)}`}
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                  {getInitials(s.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{s.name}</p>
                  <p className="text-xs text-slate-400 truncate">{s.email}</p>
                </div>
              </div>

              {/* Roles */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <RoleBadge role={s.userRole} />
                <RoleBadge role={s.staffRole} />
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-slate-500">
                {s.department && (
                  <div className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-slate-400" />{s.department}</div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" />{s.phone}</div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {s.lastLoginAt ? `Last login ${new Date(s.lastLoginAt).toLocaleDateString()}` : "Never logged in"}
                </div>
              </div>

              {!s.isActive && (
                <div className="mt-3 text-xs font-medium text-red-500 px-2 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.08)" }}>
                  Deactivated
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(24px)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-slate-800">Add Staff Member</h3>
                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="space-y-4">
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name *</Label>
                  <Input value={form.name} onChange={set("name")} className={inputCls} placeholder="Jane Smith" autoFocus /></div>
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Email *</Label>
                  <Input type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="jane@hotel.com" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Staff Role</Label>
                    <select value={form.staffRole} onChange={set("staffRole")} className={selectCls} style={selectSt}>
                      {STAFF_ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select></div>
                  <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Access Level</Label>
                    <select value={form.userRole} onChange={set("userRole")} className={selectCls} style={selectSt}>
                      {USER_ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select></div>
                </div>
                <div><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Department</Label>
                  <Input value={form.department} onChange={set("department")} className={inputCls} placeholder="Front Desk" /></div>
                <div className="text-xs text-slate-500 px-3 py-2.5 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)" }}>
                  <Mail className="w-3 h-3 inline mr-1.5 text-indigo-400" />
                  An invitation email will be sent to set up their password.
                </div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.8)" }}>Cancel</button>
                <button onClick={addStaff} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))" }}>
                  Add & Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
