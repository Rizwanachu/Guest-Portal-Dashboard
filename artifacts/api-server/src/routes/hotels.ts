import { Router } from "express";
import { db, hotelsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { auditLogsTable } from "@workspace/db";

const router = Router();
router.use(requireAuth);

// GET /hotels/me — current user's hotel
router.get("/hotels/me", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(404).json({ error: "No hotel associated with this account" }); return; }

  const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId));
  if (!hotel) { res.status(404).json({ error: "Hotel not found" }); return; }
  res.json(hotel);
});

// PATCH /hotels/me — update hotel profile
router.patch("/hotels/me", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel associated with your account" }); return; }

  const allowed = [
    "name", "tagline", "address", "city", "state", "country", "postalCode",
    "phone", "email", "website", "logoUrl", "primaryColor",
    "checkInTime", "checkOutTime", "currency", "timezone", "taxRate", "gstNumber",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const [hotel] = await db.update(hotelsTable).set(updates).where(eq(hotelsTable.id, hotelId)).returning();
  
  await db.insert(auditLogsTable).values({
    userId: req.user!.userId, hotelId, userName: req.user!.name,
    action: "hotel.update", entityType: "hotel", entityId: hotelId, details: updates,
    ipAddress: req.ip,
  }).catch(() => {});

  res.json(hotel);
});

// GET /hotels — super_admin only
router.get("/hotels", async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "super_admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const hotels = await db.select().from(hotelsTable).orderBy(hotelsTable.name);
  res.json(hotels);
});

// POST /hotels — super_admin creates a new hotel
router.post("/hotels", async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "super_admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const { name, city, country } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
  const [hotel] = await db.insert(hotelsTable).values({ name, slug, city, country }).returning();
  res.status(201).json(hotel);
});

export default router;
