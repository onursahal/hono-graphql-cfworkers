import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export type NewUser = typeof users.$inferInsert;

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
