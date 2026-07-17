import { Router, type IRouter } from "express";
import { eq, desc, count, sql, ilike, or, lte, gte, and, inArray } from "drizzle-orm";
import { db, bookingsTable, guestsTable } from "@workspace/db";
import { randomBytes } from "crypto";
import { requireAuth } from "../middleware/auth";
import {
  ListBookingsQueryParams,
  CreateBookingBody,
  GetBookingParams,
  UpdateBookingParams,
  UpdateBookingBody,
  DeleteBookingParams,
  GetCheckinLinkParams,
  GetExportDataParams,
} from "@workspace/api-zod";

const router: IRouter = Router();
router.use(requireAuth);

function generateBookingRef(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `BK-${num}`;
}

function generateToken(): string {
  return randomBytes(24).toString("hex");
}

function getBaseUrl(req: { headers: { host?: string }; protocol: string }): string {
  const host = req.headers.host ?? "localhost";
  return `${req.protocol}://${host}`;
}

// GET /bookings/departures — today's check-outs (must be before /:id)
router.get("/bookings/departures", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const departures = await db
    .select()
    .from(bookingsTable)
    .where(sql`${bookingsTable.checkOutDate} LIKE ${today + "%"}`)
    .orderBy(bookingsTable.checkOutDate);

  const guestCounts = await db
    .select({ bookingId: guestsTable.bookingId, count: count() })
    .from(guestsTable)
    .groupBy(guestsTable.bookingId);
  const guestCountMap = new Map(guestCounts.map((g) => [g.bookingId, Number(g.count)]));

  res.json(
    departures.map((b) => ({
      ...b,
      guestsSubmitted: guestCountMap.get(b.id) ?? 0,
      createdAt: b.createdAt.toISOString(),
    }))
  );
});

// GET /bookings/arrivals — today's check-ins (must be before /:id)
router.get("/bookings/arrivals", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const arrivals = await db
    .select()
    .from(bookingsTable)
    .where(sql`${bookingsTable.checkInDate} LIKE ${today + "%"}`)
    .orderBy(bookingsTable.checkInDate);

  const guestCounts = await db
    .select({ bookingId: guestsTable.bookingId, count: count() })
    .from(guestsTable)
    .groupBy(guestsTable.bookingId);
  const guestCountMap = new Map(guestCounts.map((g) => [g.bookingId, Number(g.count)]));

  res.json(
    arrivals.map((b) => ({
      ...b,
      guestsSubmitted: guestCountMap.get(b.id) ?? 0,
      createdAt: b.createdAt.toISOString(),
    }))
  );
});

// GET /bookings/occupancy — 14-day occupancy chart data (must be before /:id)
router.get("/bookings/occupancy", async (req, res): Promise<void> => {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]!);
  }

  const data = await Promise.all(
    days.map(async (date) => {
      const dayStart = date + "T00:00:00.000Z";
      const dayEnd = date + "T23:59:59.999Z";

      const [occupied] = await db
        .select({ count: count() })
        .from(bookingsTable)
        .where(
          and(
            lte(bookingsTable.checkInDate, dayEnd),
            gte(bookingsTable.checkOutDate, dayStart)
          )
        );

      const [arrivals] = await db
        .select({ count: count() })
        .from(bookingsTable)
        .where(sql`${bookingsTable.checkInDate} LIKE ${date + "%"}`);

      const [departures] = await db
        .select({ count: count() })
        .from(bookingsTable)
        .where(sql`${bookingsTable.checkOutDate} LIKE ${date + "%"}`);

      return {
        date,
        label: new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        occupied: Number(occupied?.count ?? 0),
        arrivals: Number(arrivals?.count ?? 0),
        departures: Number(departures?.count ?? 0),
      };
    })
  );

  res.json(data);
});

// POST /bookings/bulk-status — bulk status update (must be before /:id)
router.post("/bookings/bulk-status", async (req, res): Promise<void> => {
  const { ids, status } = req.body as { ids: number[]; status: string };
  if (!Array.isArray(ids) || ids.length === 0 || !["pending", "completed"].includes(status)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await db
    .update(bookingsTable)
    .set({ status: status as "pending" | "completed" })
    .where(inArray(bookingsTable.id, ids));
  res.json({ updated: ids.length });
});

// POST /bookings/bulk-delete — bulk delete (must be before /:id)
router.post("/bookings/bulk-delete", async (req, res): Promise<void> => {
  const { ids } = req.body as { ids: number[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "Invalid ids" });
    return;
  }
  await db.delete(bookingsTable).where(inArray(bookingsTable.id, ids));
  res.json({ deleted: ids.length });
});

// GET /bookings/stats — must be before /bookings/:id
router.get("/bookings/stats", async (req, res): Promise<void> => {
  const [totalBookings] = await db.select({ count: count() }).from(bookingsTable);
  const [pendingBookings] = await db
    .select({ count: count() })
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "pending"));
  const [completedBookings] = await db
    .select({ count: count() })
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "completed"));

  const today = new Date().toISOString().split("T")[0];
  const [todayCheckins] = await db
    .select({ count: count() })
    .from(bookingsTable)
    .where(eq(bookingsTable.checkInDate, today));

  const [totalGuests] = await db.select({ count: count() }).from(guestsTable);
  const [foreignNationals] = await db
    .select({ count: count() })
    .from(guestsTable)
    .where(eq(guestsTable.isForeignNational, true));

  const recentActivity = await db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(5);

  const guestCounts = await db
    .select({ bookingId: guestsTable.bookingId, count: count() })
    .from(guestsTable)
    .groupBy(guestsTable.bookingId);

  const guestCountMap = new Map(guestCounts.map((g) => [g.bookingId, Number(g.count)]));

  res.json({
    totalBookings: Number(totalBookings.count),
    pendingBookings: Number(pendingBookings.count),
    completedBookings: Number(completedBookings.count),
    todayCheckins: Number(todayCheckins.count),
    totalGuests: Number(totalGuests.count),
    foreignNationals: Number(foreignNationals.count),
    recentActivity: recentActivity.map((b) => ({
      ...b,
      guestsSubmitted: guestCountMap.get(b.id) ?? 0,
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      createdAt: b.createdAt.toISOString(),
    })),
  });
});

// GET /bookings/recent
router.get("/bookings/recent", async (req, res): Promise<void> => {
  const bookings = await db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(10);

  const guestCounts = await db
    .select({ bookingId: guestsTable.bookingId, count: count() })
    .from(guestsTable)
    .groupBy(guestsTable.bookingId);
  const guestCountMap = new Map(guestCounts.map((g) => [g.bookingId, Number(g.count)]));

  res.json(
    bookings.map((b) => ({
      ...b,
      guestsSubmitted: guestCountMap.get(b.id) ?? 0,
      createdAt: b.createdAt.toISOString(),
    }))
  );
});

// GET /bookings
router.get("/bookings", async (req, res): Promise<void> => {
  const parsed = ListBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, search, page = 1, limit = 20 } = parsed.data;

  const where: ReturnType<typeof eq>[] = [];
  if (status && status !== "all") {
    where.push(eq(bookingsTable.status, status as "pending" | "completed"));
  }

  let query = db.select().from(bookingsTable).$dynamic();
  if (status && status !== "all") {
    query = query.where(eq(bookingsTable.status, status as "pending" | "completed"));
  }
  if (search) {
    query = query.where(
      or(
        ilike(bookingsTable.guestName, `%${search}%`),
        ilike(bookingsTable.bookingRef, `%${search}%`),
        ilike(bookingsTable.roomNumber, `%${search}%`)
      )!
    );
  }

  const offset = (Number(page) - 1) * Number(limit);
  const bookings = await query.orderBy(desc(bookingsTable.createdAt)).limit(Number(limit)).offset(offset);

  // get total count
  let countQuery = db.select({ count: count() }).from(bookingsTable).$dynamic();
  if (status && status !== "all") {
    countQuery = countQuery.where(eq(bookingsTable.status, status as "pending" | "completed"));
  }
  const [{ count: total }] = await countQuery;

  const guestCounts = await db
    .select({ bookingId: guestsTable.bookingId, count: count() })
    .from(guestsTable)
    .groupBy(guestsTable.bookingId);
  const guestCountMap = new Map(guestCounts.map((g) => [g.bookingId, Number(g.count)]));

  res.json({
    bookings: bookings.map((b) => ({
      ...b,
      guestsSubmitted: guestCountMap.get(b.id) ?? 0,
      createdAt: b.createdAt.toISOString(),
    })),
    total: Number(total),
  });
});

// POST /bookings
router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data } = parsed;
  const bookingRef = generateBookingRef();
  const checkinToken = generateToken();

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      bookingRef,
      checkinToken,
      guestName: data.guestName,
      phone: data.phone,
      roomNumber: data.roomNumber,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      numberOfGuests: data.numberOfGuests,
      notes: data.notes,
      status: "pending",
    })
    .returning();

  res.status(201).json({
    ...booking,
    guestsSubmitted: 0,
    createdAt: booking.createdAt.toISOString(),
  });
});

// GET /bookings/:id
router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const guests = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.bookingId, booking.id))
    .orderBy(guestsTable.createdAt);

  res.json({
    ...booking,
    guestsSubmitted: guests.length,
    createdAt: booking.createdAt.toISOString(),
    guests: guests.map((g) => ({
      ...g,
      createdAt: g.createdAt.toISOString(),
    })),
  });
});

// PATCH /bookings/:id
router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set(parsed.data)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [{ count: guestsSubmitted }] = await db
    .select({ count: count() })
    .from(guestsTable)
    .where(eq(guestsTable.bookingId, booking.id));

  res.json({
    ...booking,
    guestsSubmitted: Number(guestsSubmitted),
    createdAt: booking.createdAt.toISOString(),
  });
});

// DELETE /bookings/:id
router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const params = DeleteBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .delete(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.sendStatus(204);
});

// POST /bookings/:id/duplicate
router.post("/bookings/:id/duplicate", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [original] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!original) { res.status(404).json({ error: "Booking not found" }); return; }

  const [duplicate] = await db
    .insert(bookingsTable)
    .values({
      bookingRef: generateBookingRef(),
      checkinToken: generateToken(),
      guestName: original.guestName,
      phone: original.phone,
      roomNumber: original.roomNumber,
      checkInDate: original.checkInDate,
      checkOutDate: original.checkOutDate,
      numberOfGuests: original.numberOfGuests,
      notes: original.notes ? `(Copy) ${original.notes}` : null,
      status: "pending",
    })
    .returning();

  res.status(201).json({
    ...duplicate,
    guestsSubmitted: 0,
    createdAt: duplicate!.createdAt.toISOString(),
  });
});

// GET /bookings/:id/checkin-link
router.get("/bookings/:id/checkin-link", async (req, res): Promise<void> => {
  const params = GetCheckinLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const base = getBaseUrl(req);
  const url = `${base}/checkin/${booking.checkinToken}`;
  const message = encodeURIComponent(
    `Dear ${booking.guestName}, please complete your check-in for Room ${booking.roomNumber} (${booking.checkInDate}): ${url}`
  );

  res.json({
    token: booking.checkinToken,
    url,
    whatsappUrl: `https://wa.me/?text=${message}`,
    smsUrl: `sms:?body=${message}`,
  });
});

// GET /bookings/:id/guests
router.get("/bookings/:id/guests", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid booking id" });
    return;
  }

  const guests = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.bookingId, id))
    .orderBy(guestsTable.createdAt);

  res.json(guests.map((g) => ({ ...g, createdAt: g.createdAt.toISOString() })));
});

// GET /bookings/:id/export
router.get("/bookings/:id/export", async (req, res): Promise<void> => {
  const params = GetExportDataParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const guests = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.bookingId, booking.id))
    .orderBy(guestsTable.createdAt);

  res.json({
    booking: {
      ...booking,
      guestsSubmitted: guests.length,
      createdAt: booking.createdAt.toISOString(),
    },
    guests: guests.map((g) => ({ ...g, createdAt: g.createdAt.toISOString() })),
    generatedAt: new Date().toISOString(),
  });
});

export default router;
