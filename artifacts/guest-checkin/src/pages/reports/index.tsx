import { AdminLayout } from "@/components/layout/AdminLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText, Download, Search, Globe, Shield, Calendar, Activity,
  Filter, X, ChevronRight, Printer, FileSpreadsheet, QrCode,
  Clock, User, AlertCircle, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type FrroGuest = {
  id: number; fullName: string; nationality: string; passportNumber: string;
  passportExpiry: string; visaNumber: string; visaType: string; visaExpiry: string;
  portOfEntry: string; arrivalDate: string; phone: string; email: string;
  bookingRef: string; roomNumber: string; checkInDate: string; checkOutDate: string;
  createdAt: string;
};

type AuditLog = {
  id: number; userName: string; action: string; entityType: string;
  entityId: number; details: Record<string, unknown>; ipAddress: string; createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  "user.login": "text-indigo-500", "user.logout": "text-slate-400",
  "booking.create": "text-emerald-500", "booking.update": "text-amber-500",
  "guest.checkin": "text-teal-500", "room.status_change": "text-violet-500",
  "staff.invite": "text-sky-500", "hotel.update": "text-orange-500",
};

type Tab = "frro" | "audit" | "occupancy";

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("frro");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);

  const dateParams = new URLSearchParams();
  if (dateFrom) dateParams.set("from", dateFrom);
  if (dateTo) dateParams.set("to", dateTo);

  const { data: frroData = [], isLoading: frroLoading } = useQuery<FrroGuest[]>({
    queryKey: ["frro", dateFrom, dateTo],
    queryFn: () => fetch(`/api/reports/frro?${dateParams}`, { credentials: "include" }).then((r) => r.json()),
    enabled: activeTab === "frro",
  });

  const auditParams = new URLSearchParams(dateParams);
  auditParams.set("page", String(auditPage));
  auditParams.set("limit", "30");

  const { data: auditData, isLoading: auditLoading } = useQuery<{ logs: AuditLog[]; total: number; pages: number }>({
    queryKey: ["audit-logs", dateFrom, dateTo, auditPage],
    queryFn: () => fetch(`/api/reports/audit-logs?${auditParams}`, { credentials: "include" }).then((r) => r.json()),
    enabled: activeTab === "audit",
  });

  const { data: occupancyData, isLoading: occupancyLoading } = useQuery<{ bookings: any[]; from: string; to: string }>({
    queryKey: ["occupancy-report", dateFrom, dateTo],
    queryFn: () => fetch(`/api/reports/occupancy?${dateParams}`, { credentials: "include" }).then((r) => r.json()),
    enabled: activeTab === "occupancy",
  });

  // FRRO filtered list
  const filteredFrro = frroData.filter((g) =>
    g.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    g.nationality?.toLowerCase().includes(search.toLowerCase()) ||
    g.passportNumber?.toLowerCase().includes(search.toLowerCase()) ||
    g.bookingRef?.toLowerCase().includes(search.toLowerCase())
  );

  function exportFrroCSV() {
    const headers = ["Name","Nationality","Passport No.","Passport Expiry","Visa No.","Visa Type","Visa Expiry","Port of Entry","Arrival Date","Phone","Email","Booking Ref","Room","Check-in","Check-out"];
    const rows = filteredFrro.map((g) => [
      g.fullName, g.nationality, g.passportNumber, g.passportExpiry ?? "",
      g.visaNumber ?? "", g.visaType ?? "", g.visaExpiry ?? "",
      g.portOfEntry ?? "", g.arrivalDate ?? "", g.phone, g.email,
      g.bookingRef, g.roomNumber ?? "", g.checkInDate?.slice(0,10), g.checkOutDate?.slice(0,10),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`));
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = encodeURI(csv); a.download = `frro_report_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast({ title: "FRRO report exported" });
  }

  function exportOccupancyCSV() {
    if (!occupancyData?.bookings) return;
    const headers = ["Booking Ref","Guest Name","Room","Check-in","Check-out","Guests","Status"];
    const rows = occupancyData.bookings.map((b) => [b.bookingRef, b.guestName, b.roomNumber ?? "", b.checkInDate?.slice(0,10), b.checkOutDate?.slice(0,10), b.numberOfGuests, b.status]);
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = encodeURI(csv); a.download = `occupancy_report_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast({ title: "Occupancy report exported" });
  }

  function printReport() {
    window.print();
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Compliance, audit, and occupancy data</p>
        </div>
        <div className="flex gap-2">
          <button onClick={printReport} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 transition-all"
            style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
            <Printer className="w-4 h-4" /> Print
          </button>
          {activeTab === "frro" && (
            <button onClick={exportFrroCSV} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
          {activeTab === "occupancy" && (
            <button onClick={exportOccupancyCSV} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 glass-card rounded-2xl p-1 w-fit">
        {([
          { key: "frro", label: "FRRO Register", icon: <Globe className="w-3.5 h-3.5" /> },
          { key: "audit", label: "Audit Logs", icon: <Shield className="w-3.5 h-3.5" /> },
          { key: "occupancy", label: "Occupancy", icon: <Calendar className="w-3.5 h-3.5" /> },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={activeTab === t.key
              ? { background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", color: "white", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }
              : { color: "#64748b" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="glass-card rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-3">
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-sm text-slate-500 font-medium">Date range:</span>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="glass-input h-8 w-36 text-sm" />
        <span className="text-slate-400 text-sm">to</span>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="glass-input h-8 w-36 text-sm" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        {activeTab === "frro" && (
          <div className="relative ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guests…" className="glass-input h-8 pl-8 w-44 text-sm" />
          </div>
        )}
      </div>

      {/* ── FRRO Tab ── */}
      <AnimatePresence mode="wait">
        {activeTab === "frro" && (
          <motion.div key="frro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-violet-500" />
                  <p className="text-sm font-semibold text-slate-700">Foreign National Register (C-Form)</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.15)", color: "#7c3aed" }}>
                  {filteredFrro.length} records
                </span>
              </div>
              {frroLoading ? (
                <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              ) : filteredFrro.length === 0 ? (
                <div className="p-12 text-center">
                  <Globe className="w-10 h-10 mx-auto mb-3 text-violet-200" />
                  <p className="font-medium text-slate-600">No foreign national records</p>
                  <p className="text-sm text-slate-400 mt-1">Records appear when foreign guests complete check-in</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
                        {["Name","Nationality","Passport","Visa No.","Visa Type","Port of Entry","Room","Check-in","Check-out"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFrro.map((g, i) => (
                        <tr key={g.id} className="hover:bg-white/30 transition-colors" style={{ borderBottom: "1px solid rgba(99,102,241,0.05)" }}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{g.fullName}</p>
                            <p className="text-xs text-slate-400">{g.email}</p>
                          </td>
                          <td className="px-4 py-3"><span className="font-medium text-slate-700">{g.nationality}</span></td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{g.passportNumber}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{g.visaNumber || "—"}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{g.visaType || "—"}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{g.portOfEntry || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5" }}>{g.roomNumber || "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{g.checkInDate?.slice(0,10)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{g.checkOutDate?.slice(0,10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Audit Logs Tab ── */}
        {activeTab === "audit" && (
          <motion.div key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <p className="text-sm font-semibold text-slate-700">System Audit Trail</p>
                </div>
                {auditData && <span className="text-xs text-slate-400">{auditData.total} total events</span>}
              </div>
              {auditLoading ? (
                <div className="p-5 space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
              ) : !auditData?.logs?.length ? (
                <div className="p-12 text-center">
                  <Activity className="w-10 h-10 mx-auto mb-3 text-indigo-200" />
                  <p className="font-medium text-slate-600">No audit events</p>
                </div>
              ) : (
                <div>
                  {auditData.logs.map((log, i) => (
                    <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/30 transition-colors"
                      style={{ borderBottom: "1px solid rgba(99,102,241,0.05)" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))" }}>
                        {(log.userName ?? "S").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-800">{log.userName ?? "System"}</span>
                          <span className={`text-xs font-mono font-semibold ${ACTION_COLORS[log.action] ?? "text-slate-500"}`}>{log.action}</span>
                          {log.entityType && <span className="text-xs text-slate-400">on {log.entityType} #{log.entityId}</span>}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate font-mono">{JSON.stringify(log.details).slice(0,80)}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                          {log.ipAddress && <span className="text-[10px] text-slate-300 font-mono">{log.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Pagination */}
                  {auditData.pages > 1 && (
                    <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(99,102,241,0.07)" }}>
                      <button onClick={() => setAuditPage((p) => Math.max(1, p - 1))} disabled={auditPage === 1}
                        className="text-sm font-medium text-indigo-500 disabled:opacity-30">← Previous</button>
                      <span className="text-xs text-slate-400">Page {auditPage} of {auditData.pages}</span>
                      <button onClick={() => setAuditPage((p) => Math.min(auditData.pages, p + 1))} disabled={auditPage === auditData.pages}
                        className="text-sm font-medium text-indigo-500 disabled:opacity-30">Next →</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Occupancy Tab ── */}
        {activeTab === "occupancy" && (
          <motion.div key="occupancy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <p className="text-sm font-semibold text-slate-700">Occupancy Report</p>
                </div>
                {occupancyData && <span className="text-xs text-slate-400">{occupancyData.bookings?.length} bookings</span>}
              </div>
              {occupancyLoading ? (
                <div className="p-5 space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
              ) : !occupancyData?.bookings?.length ? (
                <div className="p-12 text-center">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-indigo-200" />
                  <p className="font-medium text-slate-600">No bookings in selected range</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
                        {["Booking Ref","Guest Name","Room","Check-in","Check-out","Guests","Status","Nights"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {occupancyData.bookings.map((b) => {
                        const nights = Math.max(0, Math.round((new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86400000));
                        return (
                          <tr key={b.bookingRef} className="hover:bg-white/30 transition-colors" style={{ borderBottom: "1px solid rgba(99,102,241,0.05)" }}>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.bookingRef}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{b.guestName}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-mono" style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5" }}>{b.roomNumber || "TBD"}</span></td>
                            <td className="px-4 py-3 text-xs text-slate-600">{b.checkInDate?.slice(0,10)}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{b.checkOutDate?.slice(0,10)}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{b.numberOfGuests}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.status === "completed" ? "text-emerald-600" : "text-amber-600"}`}
                                style={{ background: b.status === "completed" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)" }}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">{nights}n</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
