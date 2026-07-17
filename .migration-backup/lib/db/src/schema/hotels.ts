import { pgTable, text, serial, boolean, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hotelsTable = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  tagline: text("tagline"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("India"),
  postalCode: text("postal_code"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#6366f1"),
  checkInTime: text("check_in_time").default("14:00"),
  checkOutTime: text("check_out_time").default("11:00"),
  currency: text("currency").default("INR"),
  timezone: text("timezone").default("Asia/Kolkata"),
  taxRate: real("tax_rate").default(18),
  gstNumber: text("gst_number"),
  totalRooms: integer("total_rooms").default(0),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id"), // references usersTable.id
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHotelSchema = createInsertSchema(hotelsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotelsTable.$inferSelect;
