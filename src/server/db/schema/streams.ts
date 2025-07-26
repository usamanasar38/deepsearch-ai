import { type InferSelectModel, type InferInsertModel, sql, relations } from "drizzle-orm";
import {
  timestamp,
  varchar,
  pgTable,
} from "drizzle-orm/pg-core";
import { messages, threads } from "./threads";
import { user } from "./auth";

export const streams = pgTable("stream", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  threadId: varchar("thread_id", { length: 255 })
    .notNull()
    .references(() => threads.id),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const streamsRelations = relations(streams, ({ one }) => ({
  thread: one(threads, { fields: [streams.threadId], references: [threads.id] }),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  user: one(user, { fields: [threads.userId], references: [user.id] }),
  messages: many(messages),
  streams: many(streams),
}));