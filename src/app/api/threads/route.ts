import { auth } from "@/server/auth";
import { getThreads } from "@/server/db/queries";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const threads = await getThreads({
    userId: session.user.id,
  });
  return NextResponse.json(threads);
}
