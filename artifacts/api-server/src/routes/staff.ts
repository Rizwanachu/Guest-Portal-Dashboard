import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable, staffTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { sendEmail, staffInviteHtml } from "../lib/email";
import { auditLogsTable } from "@workspace/db";

const router = Router();
router.use(requireAuth);

// GET /staff — list staff for current hotel
router.get("/staff", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.json([]); return; }

  const staffList = await db
    .select({
      staffId: staffTable.id,
      staffRole: staffTable.role,
      department: staffTable.department,
      isActive: staffTable.isActive,
      joinedAt: staffTable.joinedAt,
      userId: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      userRole: usersTable.role,
      lastLoginAt: usersTable.lastLoginAt,
    })
    .from(staffTable)
    .innerJoin(usersTable, eq(staffTable.userId, usersTable.id))
    .where(eq(staffTable.hotelId, hotelId))
    .orderBy(usersTable.name);

  res.json(staffList);
});

// POST /staff — invite / create a new staff member
router.post("/staff", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }
  if (!["admin", "super_admin"].includes(req.user!.role)) {
    res.status(403).json({ error: "Only admins can add staff" }); return;
  }

  const { name, email, role, department, userRole } = req.body;
  if (!name || !email) { res.status(400).json({ error: "name and email are required" }); return; }

  // Check if user already exists
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  let user = existing;

  if (!user) {
    // Create user with a temp password — they'll reset it
    const tempPassword = crypto.randomBytes(12).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [created] = await db.insert(usersTable).values({
      name, email: email.toLowerCase().trim(), passwordHash,
      role: userRole ?? "staff", hotelId, isActive: true,
      resetToken, resetTokenExpiry,
    }).returning();
    user = created!;

    // Send invite email
    const baseUrl = process.env.APP_URL ?? `https://${req.headers.host}`;
    const setupUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const inviterName = req.user!.name;

    // Get hotel name
    const { hotelsTable } = await import("@workspace/db");
    const [hotel] = await db.select({ name: hotelsTable.name }).from(hotelsTable).where(eq(hotelsTable.id, hotelId));
    const hotelName = hotel?.name ?? "CheckInn";

    await sendEmail({
      to: email,
      subject: `You've been added to ${hotelName}`,
      html: staffInviteHtml({ inviterName, hotelName, setupUrl, role: role ?? "staff" }),
    });
  }

  // Add to staff table
  const [staffMember] = await db.insert(staffTable).values({
    hotelId, userId: user.id,
    role: role ?? "receptionist", department: department ?? null,
    isActive: true,
  }).returning();

  await db.insert(auditLogsTable).values({
    userId: req.user!.userId, hotelId, userName: req.user!.name,
    action: "staff.invite", entityType: "staff", entityId: staffMember!.id,
    details: { name, email, role }, ipAddress: req.ip,
  }).catch(() => {});

  res.status(201).json({ ...staffMember, name: user.name, email: user.email });
});

// PATCH /staff/:id — update staff member
router.patch("/staff/:id", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }
  const id = parseInt(String(req.params.id ?? ""), 10);

  const { role, department, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (role) updates.role = role;
  if (department !== undefined) updates.department = department;
  if (isActive !== undefined) updates.isActive = isActive;

  const [staff] = await db.update(staffTable).set(updates)
    .where(and(eq(staffTable.id, id), eq(staffTable.hotelId, hotelId))).returning();
  if (!staff) { res.status(404).json({ error: "Not found" }); return; }
  res.json(staff);
});

// DELETE /staff/:id — deactivate
router.delete("/staff/:id", async (req: AuthRequest, res): Promise<void> => {
  const hotelId = req.user!.hotelId;
  if (!hotelId) { res.status(403).json({ error: "No hotel" }); return; }
  if (!["admin", "super_admin"].includes(req.user!.role)) {
    res.status(403).json({ error: "Only admins can remove staff" }); return;
  }
  const id = parseInt(String(req.params.id ?? ""), 10);

  await db.update(staffTable).set({ isActive: false })
    .where(and(eq(staffTable.id, id), eq(staffTable.hotelId, hotelId)));

  await db.insert(auditLogsTable).values({
    userId: req.user!.userId, hotelId, userName: req.user!.name,
    action: "staff.deactivate", entityType: "staff", entityId: id, ipAddress: req.ip,
  }).catch(() => {});

  res.json({ ok: true });
});

export default router;
