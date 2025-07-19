import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getThread, getThreads } from "@/server/db/queries";

export const threadRouter = createTRPCRouter({
  getThread: protectedProcedure
    .input(z.object({ threadId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { threadId } = input;

      return getThread({
        userId,
        threadId,
      });
    }),

  getThreads: protectedProcedure.query(async ({ ctx }) => {
    return getThreads({
      userId: ctx.session.user.id,
    });
  }),
});
