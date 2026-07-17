import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  hotelId: integer("hotel_id"),
  userName: text("user_name"),
  action: text("action").notNull(), // e.g. "booking.create", "guest.checkin", "user.login"
  entityType: text("entity_type"), // "booking", "guest", "user", "room"
  entityId: integer("entity_id"),
  details: jsonb("details").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
