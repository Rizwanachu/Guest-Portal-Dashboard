import { Router } from "express";
import { db, roomTypesTable, roomsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { auditLogsTable } from "@workspace/db";

const router = Router();
router.use(requireAuth);

// ─── Room Types ──────────────────────────────────────────────────────────────

router.get("/room-types", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.json([]); return; }
  const types = await db.select().from(roomTypesTable)
    .where(and(eq(roomTypesTable.hotelId, hotelId), eq(roomTypesTable.isActive, true)))
    .orderBy(roomTypesTable.name);
  res.json(types);
});

router.post("/room-types", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }

  const { name, description, basePricePerNight, maxOccupancy, bedType, amenities } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const [type] = await db.insert(roomTypesTable).values({
    hotelId, name, description, basePricePerNight: Number(basePricePerNight) || 0,
    maxOccupancy: Number(maxOccupancy) || 2, bedType: bedType || "double",
    amenities: amenities || [],
  }).returning();

  await db.insert(auditLogsTable).values({
    userId: req.user!.userId, hotelId, userName: req.user!.name,
    action: "room_type.create", entityType: "room_type", entityId: type!.id,
    ipAddress: req.ip,
  }).catch(() => {});

  res.status(201).json(type);
});

router.patch("/room-types/:id", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }
  const id = parseInt(String(req.params.id ?? ""), 10);

  const allowed = ["name", "description", "basePricePerNight", "maxOccupancy", "bedType", "amenities", "isActive"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = key === "basePricePerNight" || key === "maxOccupancy" ? Number(req.body[key]) : req.body[key];
    }
  }

  const [type] = await db.update(roomTypesTable).set(updates)
    .where(and(eq(roomTypesTable.id, id), eq(roomTypesTable.hotelId, hotelId))).returning();
  if (!type) { res.status(404).json({ error: "Not found" }); return; }
  res.json(type);
});

router.delete("/room-types/:id", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }
  const id = parseInt(String(req.params.id ?? ""), 10);

  await db.update(roomTypesTable).set({ isActive: false })
    .where(and(eq(roomTypesTable.id, id), eq(roomTypesTable.hotelId, hotelId)));
  res.json({ ok: true });
});

// ─── Rooms ───────────────────────────────────────────────────────────────────

router.get("/rooms", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.json([]); return; }

  const rooms = await db.select({
    room: roomsTable,
    roomTypeName: roomTypesTable.name,
    bedType: roomTypesTable.bedType,
    basePricePerNight: roomTypesTable.basePricePerNight,
  })
    .from(roomsTable)
    .leftJoin(roomTypesTable, eq(roomsTable.roomTypeId, roomTypesTable.id))
    .where(and(eq(roomsTable.hotelId, hotelId), eq(roomsTable.isActive, true)))
    .orderBy(roomsTable.floor, roomsTable.number);

  res.json(rooms.map((r) => ({ ...r.room, roomTypeName: r.roomTypeName, bedType: r.bedType, basePricePerNight: r.basePricePerNight })));
});

router.post("/rooms", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }

  const { number, floor, roomTypeId, status, notes } = req.body;
  if (!number) { res.status(400).json({ error: "number is required" }); return; }

  const [room] = await db.insert(roomsTable).values({
    hotelId, number, floor: Number(floor) || 1,
    roomTypeId: roomTypeId ? Number(roomTypeId) : undefined,
    status: status || "available", notes,
  }).returning();

  await db.insert(auditLogsTable).values({
    userId: req.user!.userId, hotelId, userName: req.user!.name,
    action: "room.create", entityType: "room", entityId: room!.id, ipAddress: req.ip,
  }).catch(() => {});

  res.status(201).json(room);
});

router.patch("/rooms/:id", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }
  const id = parseInt(String(req.params.id ?? ""), 10);

  const allowed = ["number", "floor", "roomTypeId", "status", "notes", "isActive"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = key === "floor" || key === "roomTypeId" ? Number(req.body[key]) : req.body[key];
    }
  }

  const [room] = await db.update(roomsTable).set(updates)
    .where(and(eq(roomsTable.id, id), eq(roomsTable.hotelId, hotelId))).returning();
  if (!room) { res.status(404).json({ error: "Not found" }); return; }
  res.json(room);
});

router.delete("/rooms/:id", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }
  const id = parseInt(String(req.params.id ?? ""), 10);

  await db.update(roomsTable).set({ isActive: false })
    .where(and(eq(roomsTable.id, id), eq(roomsTable.hotelId, hotelId)));
  res.json({ ok: true });
});

// PATCH /rooms/:id/status — quick status update
router.patch("/rooms/:id/status", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }
  const id = parseInt(String(req.params.id ?? ""), 10);
  const { status } = req.body;

  const validStatuses = ["available", "occupied", "maintenance", "out_of_order"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  const [room] = await db.update(roomsTable).set({ status })
    .where(and(eq(roomsTable.id, id), eq(roomsTable.hotelId, hotelId))).returning();
  if (!room) { res.status(404).json({ error: "Not found" }); return; }

  await db.insert(auditLogsTable).values({
    userId: req.user!.userId, hotelId, userName: req.user!.name,
    action: "room.status_change", entityType: "room", entityId: id, details: { status },
    ipAddress: req.ip,
  }).catch(() => {});

  res.json(room);
});

export default router;
