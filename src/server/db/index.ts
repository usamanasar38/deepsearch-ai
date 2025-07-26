import { env } from "@/env";
import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from './schema/auth';
import * as threadsSchema from './schema/threads';
import * as streams from './schema/streams';

export const db = drizzle(env.DATABASE_URL || "", { schema: {
    ...authSchema,
    ...threadsSchema,
    ...streams,
} });
