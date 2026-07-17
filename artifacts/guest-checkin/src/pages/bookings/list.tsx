import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useListBookings,
  useDeleteBooking,
  getListBookingsQueryKey,
  getGetBookingStatsQueryKey,
} from "@workspace/api-client-react";
import { Link, useLocation, useSearch } from "wouter";
import { useState, useDeferredValue, useMemo } from "react";
import {
  Search, Plus, BookOpen, ChevronUp, ChevronDown, ChevronsUpDown,
  Trash2, Copy, Eye, CheckSquare, Square, MoreHorizontal,
  Filter, X, UserCheck, Calendar, ArrowUpDown, Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}
function getAvatarBg(name: string) {
  const colors = [
    "bg-indigo-400","bg-violet-400","bg-emerald-400",
    "bg-amber-400","bg-rose-400","bg-teal-400","bg-sky-400","bg-orange-400",
  ];
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

// ─── Sort Header ─────────────────────────────────────────────────────────────

type SortKey = "guestName" | "roomNumber" | "checkInDate" | "checkOutDate" | "status" | "numberOfGuests";
type SortDir = "asc" | "desc";

function SortHeader({
  label, sortKey, current, dir, onSort,
}: { label: string; sortKey: SortKey; current: SortKey | null; dir: SortDir; onSort: (k: SortKey) => void }) {
  const active = current === sortKey;
  return (
    <th
      className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest cursor-pointer select-none group"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600 transition-colors">
        {label}
        <span className="ml-0.5">
          {active ? (
            dir === "asc" ? <ChevronUp className="w-3 h-3 text-indigo-500" /> : <ChevronDown className="w-3 h-3 text-indigo-500" />
          ) : (
            <ChevronsUpDown className="w-3 h-3 opacity-30" />
          )}
        </span>
      </div>
    </th>
  );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

function RowActions({ id, guestName, onDuplicate, onDelete }: {
  id: number; guestName: string;
  onDuplicate: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <button
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-indigo-50"
        style={{ border: "1px solid transparent" }}
      >
        <MoreHorizontal className="w-4 h-4 text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-8 z-50 w-44 rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(99,102,241,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/bookings/${id}`} onClick={() => setOpen(false)}>
              <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 transition-colors cursor-pointer">
                <Eye className="w-3.5 h-3.5 text-slate-400" /> View Details
              </div>
            </Link>
            <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 transition-colors cursor-pointer"
              onClick={() => { setOpen(false); onDuplicate(); }}>
              <Copy className="w-3.5 h-3.5 text-slate-400" /> Duplicate
            </div>
            <div style={{ height: "1px", background: "rgba(99,102,241,0.08)", margin: "2px 0" }} />
            <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              onClick={() => { setOpen(false); onDelete(); }}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkActionBar({
  count, onMarkPending, onMarkCompleted, onDelete, onClear,
}: { count: number; onMarkPending: () => void; onMarkCompleted: () => void; onDelete: () => void; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-3"
      style={{ background: "rgba(99,102,241,0.09)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset" }}
    >
      <span className="text-sm font-semibold text-indigo-700">{count} selected</span>
      <div className="flex-1" />
      <button onClick={onMarkPending}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-amber-700 hover:bg-amber-50"
        style={{ border: "1px solid rgba(251,191,36,0.3)" }}>
        Mark Pending
      </button>
      <button onClick={onMarkCompleted}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-emerald-700 hover:bg-emerald-50"
        style={{ border: "1px solid rgba(52,211,153,0.3)" }}>
        Mark Completed
      </button>
      <button onClick={onDelete}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-red-600 hover:bg-red-50"
        style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
        <Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete
      </button>
      <button onClick={onClear} className="text-slate-400 hover:text-slate-600 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingsList() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, setLocation] = useLocation();

  const [activeStatus, setActiveStatus] = useState<"all" | "pending" | "completed">(
    (params.get("status") as "all" | "pending" | "completed") ?? "all"
  );
  const [rawSearch, setRawSearch] = useState(params.get("search") ?? "");
  const deferredSearch = useDeferredValue(rawSearch);

  const [sortKey, setSortKey] = useState<SortKey | null>("checkInDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListBookings({
    status: activeStatus === "all" ? undefined : activeStatus,
    search: deferredSearch || undefined,
    limit: 100,
  });

  const deleteBooking = useDeleteBooking();

  // Client-side sort + date filter
  const bookings = useMemo(() => {
    let list = data?.bookings ?? [];
    if (dateFrom) list = list.filter((b) => b.checkInDate >= dateFrom);
    if (dateTo) list = list.filter((b) => b.checkInDate <= dateTo + "T23:59:59");
    if (!sortKey) return list;
    return [...list].sort((a, b) => {
      const av = (a as any)[sortKey] ?? "";
      const bv = (b as any)[sortKey] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data?.bookings, sortKey, sortDir, dateFrom, dateTo]);

  const allSelected = bookings.length > 0 && bookings.every((b) => selectedIds.has(b.id));
  const someSelected = selectedIds.size > 0;

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(bookings.map((b) => b.id)));
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBulkStatus(status: "pending" | "completed") {
    const ids = Array.from(selectedIds);
    await fetch("/api/bookings/bulk-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status }),
    });
    queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
    setSelectedIds(new Set());
    toast({ title: `${ids.length} booking${ids.length !== 1 ? "s" : ""} marked as ${status}` });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!confirm(`Delete ${ids.length} booking${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    await fetch("/api/bookings/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
    setSelectedIds(new Set());
    toast({ title: `${ids.length} booking${ids.length !== 1 ? "s" : ""} deleted` });
  }

  async function handleDuplicate(id: number, guestName: string) {
    const res = await fetch(`/api/bookings/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const dup = await res.json();
      queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      toast({ title: `Booking duplicated`, description: `New ref: ${dup.bookingRef}` });
    }
  }

  function handleDelete(id: number, guestName: string) {
    if (!confirm(`Delete booking for ${guestName}? This cannot be undone.`)) return;
    deleteBooking.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
        toast({ title: "Booking deleted" });
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      },
    });
  }

  const statusCounts = {
    all: data?.total ?? 0,
    pending: data?.bookings?.filter((b) => b.status === "pending").length ?? 0,
    completed: data?.bookings?.filter((b) => b.status === "completed").length ?? 0,
  };

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4"
      >
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Bookings</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {data?.total ?? 0} total reservation{data?.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/bookings/new">
          <Button
            className="rounded-xl font-semibold text-white h-10 px-5 transition-all"
            style={{
              background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))",
              boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 16px rgba(99,102,241,0.3)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Plus className="w-4 h-4 mr-2" />New Booking
          </Button>
        </Link>
      </motion.div>

      {/* ── Filter/Search Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="glass-card rounded-2xl p-4 mb-4"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="rounded-xl h-10 pl-10 w-full text-sm glass-input"
              placeholder="Search by guest name, booking ref, or room…"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
            />
            {rawSearch && (
              <button onClick={() => setRawSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-medium transition-all"
            style={showFilters
              ? { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "hsl(245,80%,50%)" }
              : { background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.8)", color: "#64748b" }}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {(dateFrom || dateTo) && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {(["all", "pending", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={
                activeStatus === s
                  ? { background: "rgba(99,102,241,0.13)", color: "hsl(245,80%,50%)", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset" }
                  : { background: "transparent", color: "#64748b", border: "1px solid transparent" }
              }
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {!isLoading && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                  style={activeStatus === s
                    ? { background: "rgba(99,102,241,0.15)", color: "hsl(245,80%,50%)" }
                    : { background: "rgba(100,116,139,0.1)", color: "#94a3b8" }}>
                  {statusCounts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Date Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex gap-3 mt-3 pt-3 flex-wrap" style={{ borderTop: "1px solid rgba(99,102,241,0.07)" }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500 font-medium">Check-in from</span>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="h-8 rounded-lg text-xs glass-input w-36" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">to</span>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="h-8 rounded-lg text-xs glass-input w-36" />
                </div>
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium">
                    <X className="w-3 h-3" /> Clear dates
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Bulk Action Bar ── */}
      <AnimatePresence>
        {someSelected && (
          <BulkActionBar
            count={selectedIds.size}
            onMarkPending={() => handleBulkStatus("pending")}
            onMarkCompleted={() => handleBulkStatus("completed")}
            onDelete={handleBulkDelete}
            onClear={() => setSelectedIds(new Set())}
          />
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.09)" }}>
                <th className="px-5 py-3.5 w-10">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-500 transition-colors">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <SortHeader label="Guest" sortKey="guestName" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Room" sortKey="roomNumber" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Check-in" sortKey="checkInDate" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Check-out" sortKey="checkOutDate" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Guests" sortKey="numberOfGuests" current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-5 py-3.5 w-14" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                    <td colSpan={8} className="px-5 py-3">
                      <Skeleton className="h-9 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <BookOpen className="w-10 h-10 mx-auto opacity-10 mb-3 text-indigo-400" />
                    <p className="font-medium text-slate-600">No bookings found</p>
                    <p className="text-sm mt-1 text-slate-400">
                      {rawSearch ? `No results for "${rawSearch}"` : "Try adjusting your filters or create a new booking."}
                    </p>
                  </td>
                </tr>
              ) : (
                bookings.map((b, i) => {
                  const isSelected = selectedIds.has(b.id);
                  return (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.02 * Math.min(i, 15) }}
                      className="transition-all group"
                      style={{
                        borderBottom: i < bookings.length - 1 ? "1px solid rgba(99,102,241,0.06)" : "none",
                        background: isSelected ? "rgba(99,102,241,0.05)" : undefined,
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => toggleOne(b.id)}
                          className="text-slate-300 hover:text-indigo-500 transition-colors"
                        >
                          {isSelected
                            ? <CheckSquare className="w-4 h-4 text-indigo-500" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/bookings/${b.id}`} className="flex items-center gap-3 hover:opacity-80">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${getAvatarBg(b.guestName)}`}
                            style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
                            {getInitials(b.guestName)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{b.guestName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{b.bookingRef}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-slate-600"
                          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.14)" }}>
                          {b.roomNumber || "TBD"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {new Date(b.checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {new Date(b.checkOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-600 font-medium">{(b as any).guestsSubmitted ?? 0}</span>
                          <span className="text-slate-400">/{b.numberOfGuests}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <RowActions
                            id={b.id}
                            guestName={b.guestName}
                            onDuplicate={() => handleDuplicate(b.id, b.guestName)}
                            onDelete={() => handleDelete(b.id, b.guestName)}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!isLoading && bookings.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(99,102,241,0.07)" }}>
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{bookings.length}</span> booking{bookings.length !== 1 ? "s" : ""}
              {someSelected && <span className="ml-2 text-indigo-500 font-semibold">· {selectedIds.size} selected</span>}
            </p>
            <button
              onClick={() => {
                const headers = ["Ref", "Guest", "Phone", "Room", "Check-in", "Check-out", "Guests", "Status"];
                const rows = bookings.map((b) => [
                  b.bookingRef, b.guestName, b.phone ?? "", b.roomNumber ?? "",
                  b.checkInDate, b.checkOutDate, b.numberOfGuests, b.status,
                ]);
                const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map((r) => r.join(",")).join("\n");
                const a = document.createElement("a");
                a.href = encodeURI(csv);
                a.download = "bookings.csv";
                a.click();
              }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
