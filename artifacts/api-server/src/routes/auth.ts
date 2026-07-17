import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable, hotelsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { signToken, verifyToken, COOKIE_NAME, setCookieOptions } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { sendEmail, passwordResetHtml } from "../lib/email";
import { auditLogsTable } from "@workspace/db";

const router = Router();

// ─── Setup (first-run only) ──────────────────────────────────────────────────
router.post("/auth/setup", async (req, res): Promise<void> => {
  const existingUsers = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  if (existingUsers.length > 0) {
    res.status(409).json({ error: "Setup already completed. Please log in." });
    return;
  }

  const { name, email, password, hotelName, hotelCity } = req.body;
  if (!name || !email || !password || !hotelName) {
    res.status(400).json({ error: "name, email, password, and hotelName are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = hotelName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Create hotel first, then user
  const [hotel] = await db.insert(hotelsTable).values({
    name: hotelName,
    slug: `${slug}-${Date.now()}`,
    city: hotelCity ?? "",
    ownerId: null as any,
  }).returning();

  const [user] = await db.insert(usersTable).values({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: "admin",
    hotelId: hotel!.id,
    isActive: true,
  }).returning();

  // Link owner
  await db.update(hotelsTable).set({ ownerId: user!.id }).where(eq(hotelsTable.id, hotel!.id));

  const safeUser = { ...user, passwordHash: undefined, resetToken: undefined, resetTokenExpiry: undefined };
  const token = signToken(user as any);
  res.cookie(COOKIE_NAME, token, setCookieOptions());
  res.status(201).json({ user: safeUser, hotel });
});

// ─── Check setup status ──────────────────────────────────────────────────────
router.get("/auth/setup-status", async (_req, res): Promise<void> => {
  const existingUsers = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  res.json({ setupRequired: existingUsers.length === 0 });
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(
    and(eq(usersTable.email, email.toLowerCase().trim()), eq(usersTable.isActive, true))
  );

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));

  // Audit log
  await db.insert(auditLogsTable).values({
    userId: user.id, hotelId: user.hotelId ?? undefined, userName: user.name,
    action: "user.login", entityType: "user", entityId: user.id,
    ipAddress: req.ip, userAgent: req.headers["user-agent"],
  }).catch(() => {});

  const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, hotelId: user.hotelId, phone: user.phone, isActive: user.isActive, lastLoginAt: user.lastLoginAt, createdAt: user.createdAt };
  const token = signToken(safeUser as any);
  res.cookie(COOKIE_NAME, token, setCookieOptions());
  res.json({ user: safeUser });
});

// ─── Logout ──────────────────────────────────────────────────────────────────
router.post("/auth/logout", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  await db.insert(auditLogsTable).values({
    userId: req.user!.userId, hotelId: req.user!.hotelId ?? undefined, userName: req.user!.name,
    action: "user.logout", entityType: "user", entityId: req.user!.userId,
    ipAddress: req.ip,
  }).catch(() => {});
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

// ─── Me ──────────────────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select({
    id: usersTable.id, email: usersTable.email, name: usersTable.name,
    role: usersTable.role, hotelId: usersTable.hotelId, phone: usersTable.phone,
    isActive: usersTable.isActive, lastLoginAt: usersTable.lastLoginAt, createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, req.user!.userId));

  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  if (!user.isActive) { res.clearCookie(COOKIE_NAME); res.status(401).json({ error: "Account deactivated" }); return; }
  res.json({ user });
});

// ─── Change Password ─────────────────────────────────────────────────────────
router.post("/auth/change-password", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Current password is incorrect" }); return; }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));

  await db.insert(auditLogsTable).values({
    userId: user.id, hotelId: user.hotelId ?? undefined, userName: user.name,
    action: "user.password_change", entityType: "user", entityId: user.id, ipAddress: req.ip,
  }).catch(() => {});

  res.json({ ok: true });
});

// ─── Forgot Password ─────────────────────────────────────────────────────────
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  // Always return success to prevent email enumeration
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(usersTable).set({ resetToken, resetTokenExpiry }).where(eq(usersTable.id, user.id));

    const baseUrl = process.env.APP_URL ?? `https://${req.headers.host}`;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    let hotelName = "CheckInn";
    if (user.hotelId) {
      const [hotel] = await db.select({ name: hotelsTable.name }).from(hotelsTable).where(eq(hotelsTable.id, user.hotelId));
      if (hotel) hotelName = hotel.name;
    }

    await sendEmail({ to: user.email, subject: "Reset your password", html: passwordResetHtml({ name: user.name, resetUrl, hotelName }) });
  }

  res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
});

// ─── Reset Password ──────────────────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password) { res.status(400).json({ error: "token and password are required" }); return; }
  if (password.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token));
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(usersTable).set({ passwordHash, resetToken: null, resetTokenExpiry: null }).where(eq(usersTable.id, user.id));
  res.json({ ok: true });
});

// ─── Update Profile ──────────────────────────────────────────────────────────
router.patch("/auth/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { name, phone } = req.body;
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.userId)).returning({
    id: usersTable.id, email: usersTable.email, name: usersTable.name,
    role: usersTable.role, hotelId: usersTable.hotelId, phone: usersTable.phone,
  });
  res.json({ user });
});

export default router;
