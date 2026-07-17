import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bookingsTable } from "./bookings";

export const guestsTable = pgTable("guests", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookingsTable.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  nationality: text("nationality").notNull(),
  idType: text("id_type", {
    enum: ["aadhaar", "passport", "driving_licence", "voter_id", "other"],
  }).notNull(),
  idNumber: text("id_number"),
  idImageUrl: text("id_image_url"),
  signatureUrl: text("signature_url"),
  isForeignNational: boolean("is_foreign_national").notNull().default(false),
  numberOfGuests: integer("number_of_guests"),
  // FRRO / C-Form fields
  visaNumber: text("visa_number"),
  visaType: text("visa_type"),
  visaExpiry: text("visa_expiry"),
  portOfEntry: text("port_of_entry"),
  arrivalDate: text("arrival_date"),
  passportNumber: text("passport_number"),
  passportExpiry: text("passport_expiry"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGuestSchema = createInsertSchema(guestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guestsTable.$inferSelect;
