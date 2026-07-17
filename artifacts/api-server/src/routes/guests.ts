import { Router, type IRouter } from "express";
import { eq, ilike, or, desc } from "drizzle-orm";
import { db, bookingsTable, guestsTable } from "@workspace/db";
import {
  GetCheckinSessionParams,
  SubmitGuestCheckinParams,
  SubmitGuestCheckinBody,
  UploadGuestDocumentParams,
  UploadGuestDocumentBody,
  SearchGuestsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Store data URLs directly in the database (serverless-compatible — no local filesystem).
// For high-volume production use, migrate to an object storage service instead.
function saveDataUrl(dataUrl: string, _fileName: string): string {
  return dataUrl;
}

// GET /checkin/:token — public endpoint for guests
router.get("/checkin/:token", async (req, res): Promise<void> => {
  const params = GetCheckinSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.checkinToken, params.data.token));

  if (!booking) {
    res.status(404).json({ error: "Invalid or expired check-in link" });
    return;
  }

  // Count already-submitted guests
  const guests = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.bookingId, booking.id));

  res.json({
    bookingId: booking.id,
    bookingRef: booking.bookingRef,
    guestName: booking.guestName,
    roomNumber: booking.roomNumber,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    numberOfGuests: booking.numberOfGuests,
    guestsSubmitted: guests.length,
  });
});

// POST /checkin/:token/guests — public endpoint for guests
router.post("/checkin/:token/guests", async (req, res): Promise<void> => {
  const params = SubmitGuestCheckinParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitGuestCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.checkinToken, params.data.token));

  if (!booking) {
    res.status(404).json({ error: "Invalid or expired check-in link" });
    return;
  }

  const { data } = parsed;
  const isForeignNational =
    data.isForeignNational ??
    (data.nationality?.toLowerCase() !== "india" && data.nationality?.toLowerCase() !== "indian");

  const [guest] = await db
    .insert(guestsTable)
    .values({
      bookingId: booking.id,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      nationality: data.nationality,
      idType: data.idType,
      idNumber: data.idNumber,
      isForeignNational,
      numberOfGuests: data.numberOfGuests,
      visaNumber: data.visaNumber,
      visaType: data.visaType,
      visaExpiry: data.visaExpiry,
      portOfEntry: data.portOfEntry,
      arrivalDate: data.arrivalDate,
      passportNumber: data.passportNumber,
      passportExpiry: data.passportExpiry,
    })
    .returning();

  // Check if all guests have submitted and auto-complete booking
  const allGuests = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.bookingId, booking.id));

  if (allGuests.length >= booking.numberOfGuests) {
    await db
      .update(bookingsTable)
      .set({ status: "completed" })
      .where(eq(bookingsTable.id, booking.id));
  }

  res.status(201).json({
    ...guest,
    createdAt: guest.createdAt.toISOString(),
  });
});

// POST /guests/:id/upload — upload ID document or signature
router.post("/guests/:id/upload", async (req, res): Promise<void> => {
  const params = UploadGuestDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UploadGuestDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [guest] = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.id, params.data.id));

  if (!guest) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  const { type, dataUrl, fileName } = parsed.data;
  const storedUrl = saveDataUrl(dataUrl, fileName);

  const updates: Partial<typeof guestsTable.$inferSelect> = {};
  if (type === "id_document") {
    updates.idImageUrl = storedUrl;
  } else if (type === "signature") {
    updates.signatureUrl = storedUrl;
  } else if (type === "passport") {
    updates.idImageUrl = storedUrl;
  }

  const [updated] = await db
    .update(guestsTable)
    .set(updates)
    .where(eq(guestsTable.id, guest.id))
    .returning();

  res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
  });
});

// GET /guests/search
router.get("/guests/search", async (req, res): Promise<void> => {
  const parsed = SearchGuestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q } = parsed.data;

  const results = await db
    .select({
      id: guestsTable.id,
      bookingId: guestsTable.bookingId,
      bookingRef: bookingsTable.bookingRef,
      roomNumber: bookingsTable.roomNumber,
      fullName: guestsTable.fullName,
      phone: guestsTable.phone,
      email: guestsTable.email,
      nationality: guestsTable.nationality,
      idType: guestsTable.idType,
      isForeignNational: guestsTable.isForeignNational,
      createdAt: guestsTable.createdAt,
    })
    .from(guestsTable)
    .innerJoin(bookingsTable, eq(guestsTable.bookingId, bookingsTable.id))
    .where(
      or(
        ilike(guestsTable.fullName, `%${q}%`),
        ilike(guestsTable.phone, `%${q}%`),
        ilike(guestsTable.email, `%${q}%`),
        ilike(guestsTable.nationality, `%${q}%`),
        ilike(bookingsTable.bookingRef, `%${q}%`)
      )!
    )
    .orderBy(desc(guestsTable.createdAt))
    .limit(50);

  res.json(results.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

export default router;
