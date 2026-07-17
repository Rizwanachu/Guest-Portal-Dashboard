import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, Loader2, Globe, Phone, Mail, Clock, DollarSign, Percent, Upload, Palette, FileText, MapPin, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Hotel = {
  id: number; name: string; tagline: string; address: string; city: string;
  state: string; country: string; postalCode: string; phone: string; email: string;
  website: string; logoUrl: string; primaryColor: string; checkInTime: string;
  checkOutTime: string; currency: string; timezone: string; taxRate: number; gstNumber: string;
};

const TIMEZONES = ["Asia/Kolkata","Asia/Dubai","Asia/Singapore","Europe/London","America/New_York","America/Los_Angeles","UTC"];
const CURRENCIES = ["INR","USD","EUR","GBP","AED","SGD"];

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}>
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

export default function HotelProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<Hotel>>({});
  const [isDirty, setIsDirty] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { data: hotel, isLoading } = useQuery<Hotel>({
    queryKey: ["hotel", "me"],
    queryFn: () => fetch("/api/hotels/me", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user?.hotelId,
  });

  useEffect(() => {
    if (hotel) setForm(hotel);
  }, [hotel]);

  function set(key: keyof Hotel) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setIsDirty(true);
    };
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/hotels/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["hotel", "me"] });
      setSaved(true);
      setIsDirty(false);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: "Hotel profile saved" });
    } else {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-5">
          {[...Array(4)].map((_, i) => <div key={i} className="glass-card rounded-2xl h-48 animate-pulse" />)}
        </div>
      </AdminLayout>
    );
  }

  const selectClass = "w-full h-9 rounded-xl px-3 text-sm outline-none transition-all appearance-none";
  const selectStyle = { background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.75)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset" };

  return (
    <AdminLayout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Hotel Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your property information and settings</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleSave} disabled={saving || !isDirty}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: saved ? "linear-gradient(145deg,#10b981,#059669)" : "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 4px 16px rgba(99,102,241,0.3), 0 1px 0 rgba(255,255,255,0.2) inset" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-6">
          <SectionHeader icon={<Building2 className="w-4 h-4 text-indigo-500" />} title="Basic Information" description="Your hotel's identity" />
          <div className="space-y-4">
            <FormField label="Hotel Name *">
              <Input value={form.name ?? ""} onChange={set("name")} className="glass-input h-9" placeholder="Grand Palace Hotel" />
            </FormField>
            <FormField label="Tagline">
              <Input value={form.tagline ?? ""} onChange={set("tagline")} className="glass-input h-9" placeholder="Where every stay feels like home" />
            </FormField>
            <FormField label="GST Number">
              <Input value={form.gstNumber ?? ""} onChange={set("gstNumber")} className="glass-input h-9 font-mono" placeholder="27AABCU9603R1ZV" />
            </FormField>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
          <SectionHeader icon={<Phone className="w-4 h-4 text-indigo-500" />} title="Contact Details" description="How guests reach you" />
          <div className="space-y-4">
            <FormField label="Phone">
              <Input value={form.phone ?? ""} onChange={set("phone")} className="glass-input h-9" placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email ?? ""} onChange={set("email")} className="glass-input h-9" placeholder="info@hotel.com" />
            </FormField>
            <FormField label="Website">
              <Input value={form.website ?? ""} onChange={set("website")} className="glass-input h-9" placeholder="https://hotel.com" />
            </FormField>
          </div>
        </motion.div>

        {/* Address */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6">
          <SectionHeader icon={<MapPin className="w-4 h-4 text-indigo-500" />} title="Address" description="Your property location" />
          <div className="space-y-4">
            <FormField label="Street Address">
              <Input value={form.address ?? ""} onChange={set("address")} className="glass-input h-9" placeholder="123 Hotel Street" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="City">
                <Input value={form.city ?? ""} onChange={set("city")} className="glass-input h-9" placeholder="Mumbai" />
              </FormField>
              <FormField label="State">
                <Input value={form.state ?? ""} onChange={set("state")} className="glass-input h-9" placeholder="Maharashtra" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Country">
                <Input value={form.country ?? ""} onChange={set("country")} className="glass-input h-9" placeholder="India" />
              </FormField>
              <FormField label="Postal Code">
                <Input value={form.postalCode ?? ""} onChange={set("postalCode")} className="glass-input h-9 font-mono" placeholder="400001" />
              </FormField>
            </div>
          </div>
        </motion.div>

        {/* Operations */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
          <SectionHeader icon={<Clock className="w-4 h-4 text-indigo-500" />} title="Operations" description="Check-in times and regional settings" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Check-in Time">
                <Input type="time" value={form.checkInTime ?? "14:00"} onChange={set("checkInTime")} className="glass-input h-9" />
              </FormField>
              <FormField label="Check-out Time">
                <Input type="time" value={form.checkOutTime ?? "11:00"} onChange={set("checkOutTime")} className="glass-input h-9" />
              </FormField>
            </div>
            <FormField label="Timezone">
              <select value={form.timezone ?? "Asia/Kolkata"} onChange={set("timezone")} className={selectClass} style={selectStyle}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Currency">
                <select value={form.currency ?? "INR"} onChange={set("currency")} className={selectClass} style={selectStyle}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Tax Rate (%)">
                <Input type="number" min="0" max="100" step="0.1" value={form.taxRate ?? 18} onChange={set("taxRate")} className="glass-input h-9" />
              </FormField>
            </div>
          </div>
        </motion.div>

        {/* Branding */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl p-6 lg:col-span-2">
          <SectionHeader icon={<Palette className="w-4 h-4 text-indigo-500" />} title="Branding" description="Logo and primary color for guest-facing pages" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Primary Color</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primaryColor ?? "#6366f1"} onChange={set("primaryColor")}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5"
                  style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.8)" }} />
                <Input value={form.primaryColor ?? "#6366f1"} onChange={set("primaryColor")} className="glass-input h-9 font-mono w-32" placeholder="#6366f1" />
                <div className="w-9 h-9 rounded-xl" style={{ background: form.primaryColor ?? "#6366f1", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Logo URL</Label>
              <div className="flex gap-2">
                <Input value={form.logoUrl ?? ""} onChange={set("logoUrl")} className="glass-input h-9 flex-1" placeholder="https://cdn.hotel.com/logo.png" />
                {form.logoUrl && (
                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/60 flex-shrink-0">
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.src = "")} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
