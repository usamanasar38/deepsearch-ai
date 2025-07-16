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
          <div className="flex-1">
            <main className="container mx-auto px-4 py-8">
              <h1 className="text-2xl font-bold">Welcome to the Home Page</h1>
              <p>This is a simple example of a Next.js page with a sidebar.</p>
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
