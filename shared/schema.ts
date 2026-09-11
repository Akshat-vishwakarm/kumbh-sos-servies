import { pgTable, text, serial, integer, boolean, timestamp, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const REPORT_TYPES = ["medical", "lost_self", "lost_other", "volunteer"] as const;
export const REPORT_STATUS = ["active", "resolved", "expired"] as const;

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: REPORT_TYPES }).notNull(),
  name: text("name"),
  mobile: text("mobile"),
  age: integer("age"),
  gender: text("gender"),
  description: text("description"), // For "Last seen note" or general details
  photoUrl: text("photo_url"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  status: text("status", { enum: REPORT_STATUS }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({ 
  id: true, 
  createdAt: true,
  lastSeenAt: true,
  status: true 
}).extend({
  lat: z.number(),
  lng: z.number(),
  age: z.coerce.number().optional(),
  photoUrl: z.string().optional(),
  gender: z.string().optional(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type CreateReportRequest = InsertReport;
export type UpdateReportRequest = Partial<InsertReport> & { status?: typeof REPORT_STATUS[number] };

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("volunteer").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
