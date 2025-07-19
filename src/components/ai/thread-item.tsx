'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Edit3Icon, MoreHorizontalIcon, PinIcon, Trash2Icon } from "lucide-react"
import { memo, useState } from "react"
import equal from "fast-deep-equal/es6"
import Link from "next/link"
import { DB } from "@/server/db/schema/threads";

interface ThreadItemProps {
    thread: DB.Thread,
    threadId: string | undefined,
}

export const ThreadItem = memo(
    ({
        thread,
        threadId,
    }: ThreadItemProps) => {
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const isActive = threadId === thread.id;


        const handleRename = () => {
            console.log("Rename thread:", thread)
        }

        const handleMove = () => {
            console.log("Move thread:", thread)
        }

        const handleDelete = () => {
            console.log("Delete thread:", thread)
        }

        return (
            <SidebarMenuItem>
                <div
                    className={cn(
                        "group/item flex w-full items-center rounded-sm hover:bg-accent/50",
                        isMenuOpen && "bg-accent/50",
                        isActive && "bg-accent/60"
                    )}
                >
                    <SidebarMenuButton
                        asChild
                        className={cn(
                            "flex-1 hover:bg-transparent",
                            isActive && "text-foreground"
                        )}
                    >
                        <Link
                            href={`/?id=${thread.id}`}
                            className="flex items-center justify-between"
                        >
                            <span className="truncate">{thread.title}</span>

                            <DropdownMenu onOpenChange={setIsMenuOpen}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "rounded p-1 transition-opacity",
                                            isMenuOpen || "opacity-0 group-hover/item:opacity-100"
                                        )}
                                    >
                                        <MoreHorizontalIcon className="mr-1 h-4 w-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleRename}>
                                        <Edit3Icon className="h-4 w-4" />
                                        Rename
                                    </DropdownMenuItem>
                                    {/* <DropdownMenuItem onClick={handleTogglePin}>
                                        <PinIcon className="h-4 w-4" />
                                        {thread.pinned ? "Unpin" : "Pin"}
                                    </DropdownMenuItem> */}
                                    <DropdownMenuItem onClick={handleDelete} variant="destructive">
                                        <Trash2Icon className="h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Link>
                    </SidebarMenuButton>
                </div>
            </SidebarMenuItem>
        )
    },
    (prevProps, nextProps) => {
        return (
            equal(prevProps.thread, nextProps.thread) &&
            prevProps.threadId === nextProps.threadId
        )
    }
)

ThreadItem.displayName = "ThreadItem"
