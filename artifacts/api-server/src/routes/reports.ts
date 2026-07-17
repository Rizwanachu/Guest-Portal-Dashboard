import { Router } from "express";
import { db, guestsTable, bookingsTable, auditLogsTable } from "@workspace/db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import QRCode from "qrcode";

const router = Router();
router.use(requireAuth);

// ─── FRRO Report — foreign nationals ─────────────────────────────────────────
router.get("/reports/frro", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  const { from, to } = req.query;

  const conditions = [eq(guestsTable.isForeignNational, true)];
  if (from) conditions.push(gte(guestsTable.createdAt, new Date(from as string)));
  if (to) conditions.push(lte(guestsTable.createdAt, new Date(to as string)));

  const guests = await db
    .select({
      id: guestsTable.id, fullName: guestsTable.fullName, nationality: guestsTable.nationality,
      passportNumber: guestsTable.passportNumber, passportExpiry: guestsTable.passportExpiry,
      visaNumber: guestsTable.visaNumber, visaType: guestsTable.visaType, visaExpiry: guestsTable.visaExpiry,
      portOfEntry: guestsTable.portOfEntry, arrivalDate: guestsTable.arrivalDate,
      phone: guestsTable.phone, email: guestsTable.email, idImageUrl: guestsTable.idImageUrl,
      createdAt: guestsTable.createdAt,
      bookingRef: bookingsTable.bookingRef, roomNumber: bookingsTable.roomNumber,
      checkInDate: bookingsTable.checkInDate, checkOutDate: bookingsTable.checkOutDate,
    })
    .from(guestsTable)
    .innerJoin(bookingsTable, eq(guestsTable.bookingId, bookingsTable.id))
    .where(and(...conditions))
    .orderBy(desc(guestsTable.createdAt));

  res.json(guests);
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get("/reports/audit-logs", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  const page = parseInt(req.query.page as string ?? "1", 10);
  const limit = parseInt(req.query.limit as string ?? "50", 10);
  const offset = (page - 1) * limit;
  const { action, from, to } = req.query;

  const conditions = [];
  if (hotelId) conditions.push(eq(auditLogsTable.hotelId, hotelId));
  if (action) conditions.push(eq(auditLogsTable.action, action as string));
  if (from) conditions.push(gte(auditLogsTable.createdAt, new Date(from as string)));
  if (to) conditions.push(lte(auditLogsTable.createdAt, new Date(to as string)));

  const logs = await db.select().from(auditLogsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(auditLogsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({ logs, total: Number(count), page, limit, pages: Math.ceil(Number(count) / limit) });
});

// ─── Occupancy Report ─────────────────────────────────────────────────────────
router.get("/reports/occupancy", async (req: AuthRequest, res): Promise<void> => {
  const { from, to } = req.query;
  const fromDate = from as string ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const toDate = to as string ?? new Date().toISOString().slice(0, 10);

  const bookings = await db.select({
    bookingRef: bookingsTable.bookingRef, guestName: bookingsTable.guestName,
    roomNumber: bookingsTable.roomNumber, checkInDate: bookingsTable.checkInDate,
    checkOutDate: bookingsTable.checkOutDate, numberOfGuests: bookingsTable.numberOfGuests,
    status: bookingsTable.status, createdAt: bookingsTable.createdAt,
  }).from(bookingsTable)
    .where(and(
      gte(bookingsTable.checkInDate, `${fromDate}T00:00:00.000Z`),
      lte(bookingsTable.checkInDate, `${toDate}T23:59:59.999Z`),
    ))
    .orderBy(bookingsTable.checkInDate);

  res.json({ bookings, from: fromDate, to: toDate });
});

// ─── Guest Stats ──────────────────────────────────────────────────────────────
router.get("/reports/guests", async (req: AuthRequest, res): Promise<void> => {
  const { from, to } = req.query;

  const conditions = [];
  if (from) conditions.push(gte(guestsTable.createdAt, new Date(from as string)));
  if (to) conditions.push(lte(guestsTable.createdAt, new Date(to as string)));

  const guests = await db
    .select({
      id: guestsTable.id, fullName: guestsTable.fullName, nationality: guestsTable.nationality,
      idType: guestsTable.idType, isForeignNational: guestsTable.isForeignNational,
      phone: guestsTable.phone, email: guestsTable.email,
      createdAt: guestsTable.createdAt, bookingRef: bookingsTable.bookingRef,
      roomNumber: bookingsTable.roomNumber, checkInDate: bookingsTable.checkInDate,
    })
    .from(guestsTable)
    .innerJoin(bookingsTable, eq(guestsTable.bookingId, bookingsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(guestsTable.createdAt));

  res.json(guests);
});

// ─── QR Code for booking ──────────────────────────────────────────────────────
router.get("/reports/qr/:bookingId", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(String(req.params.bookingId ?? ""), 10);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }

  const baseUrl = process.env.APP_URL ?? `https://${req.headers.host}`;
  const checkinUrl = `${baseUrl}/checkin/${booking.checkinToken}`;

  const qrSvg = await QRCode.toString(checkinUrl, { type: "svg" });
  const qrDataUrl = await QRCode.toDataURL(checkinUrl);

  res.json({ url: checkinUrl, svg: qrSvg, dataUrl: qrDataUrl, bookingRef: booking.bookingRef });
});

export default router;
