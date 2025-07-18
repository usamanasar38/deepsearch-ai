import { relations, sql } from "drizzle-orm";
import {
  integer,
  timestamp,
  varchar,
  json,
  pgTable,
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { user } from "./auth";

export const threads = pgTable("thread", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const threadsRelations = relations(threads, ({ one, many }) => ({
  user: one(user, { fields: [threads.userId], references: [user.id] }),
  messages: many(messages),
}));

export const messages = pgTable("message", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  threadId: varchar("thread_id", { length: 255 })
    .notNull()
    .references(() => threads.id),
  role: varchar("role", { length: 255 }).notNull(),
  parts: json("parts").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(threads, { fields: [messages.threadId], references: [threads.id] }),
}));

export declare namespace DB {
  export type Thread = InferSelectModel<typeof threads>;
  export type NewThread = InferInsertModel<typeof threads>;

  export type Message = InferSelectModel<typeof messages>;
  export type NewMessage = InferInsertModel<typeof messages>;
}
