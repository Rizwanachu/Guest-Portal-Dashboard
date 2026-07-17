import { pgTable, text, serial, boolean, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomTypesTable = pgTable("room_types", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  basePricePerNight: real("base_price_per_night").notNull().default(0),
  maxOccupancy: integer("max_occupancy").notNull().default(2),
  bedType: text("bed_type", { enum: ["single", "double", "twin", "queen", "king", "suite"] }).default("double"),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull(),
  roomTypeId: integer("room_type_id"),
  number: text("number").notNull(),
  floor: integer("floor").default(1),
  status: text("status", { enum: ["available", "occupied", "maintenance", "out_of_order"] }).notNull().default("available"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRoomTypeSchema = createInsertSchema(roomTypesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRoomType = z.infer<typeof insertRoomTypeSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type RoomType = typeof roomTypesTable.$inferSelect;
export type Room = typeof roomsTable.$inferSelect;
