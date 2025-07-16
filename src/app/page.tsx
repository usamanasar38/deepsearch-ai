import Chat from "@/components/ai/chat";
import Header from "@/components/header";
import { ThreadsSidebar } from "@/components/threads-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Image from "next/image";

export default function Home() {
  return (
    <SidebarProvider>
      <ThreadsSidebar />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <Header />
          <div className="relative flex h-[calc(100dvh-64px)] flex-col">
            <Chat />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
