"use client";

import { SidebarTrigger } from "./ui/sidebar";
import { ThemeSwitcher } from "./ui/kibo-ui/theme-switcher";
import { UserButton } from "./user-button";

export default function Header() {

  return (
    <header className="pointer-events-none absolute top-0 z-50 w-full">
      <div className="flex w-full items-center justify-between">
        <div className="pointer-events-auto">
          <div className="bg-background/10 flex items-center gap-2 rounded-xl p-2 backdrop-blur-sm">
            <SidebarTrigger />
            <div className="bg-border h-4 w-px" />
          </div>
        </div>
        <div className="bg-background/10 pointer-events-auto flex items-center space-x-2 rounded-xl p-2 backdrop-blur-sm">
          <ThemeSwitcher />
          <div className="bg-border h-4 w-px" />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
