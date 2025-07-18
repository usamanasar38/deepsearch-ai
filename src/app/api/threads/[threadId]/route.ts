import { auth } from "@/server/auth";
import { getThread } from "@/server/db/queries";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { threadId } = await params;

  const threads = await getThread({
    userId: session.user.id,
    threadId,
  });
  return NextResponse.json(threads);
}
