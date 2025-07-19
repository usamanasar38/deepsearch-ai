'use client';

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@/components/ui/sidebar";
import { GalleryVerticalEndIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { ThreadItem } from "./ai/thread-item";
import { api } from "@/trpc/react";

export function ThreadsSidebar({ threadId }: { threadId: string | undefined }) {
  const { data: threads } = api.threads.getThreads.useQuery();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex w-full items-center justify-center gap-2">
          <Link href="/">
            <GalleryVerticalEndIcon className="h-auto w-full max-w-52 px-4 pt-1.5" />
          </Link>
        </div>
        <div className="bg-border my-2 h-px w-full" />

        <Button asChild>
          <Link href="/">New Chat</Link>
        </Button>

        <Button variant="outline">
          <SearchIcon className="h-4 w-4" />
          Search Threads
          <div className="ml-auto flex items-center gap-1 text-xs">
            <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono font-medium select-none">
              <span className="text-sm">⌘</span>
              <span className="text-xs">K</span>
            </kbd>
          </div>
        </Button>
      </SidebarHeader>
      <SidebarContent className="scrollbar-hide">
        <SidebarMenu>
          {threads?.map((thread) => (
            <ThreadItem key={thread.id} threadId={threadId} thread={thread} />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
