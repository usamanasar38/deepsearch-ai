"use client"

import { Button } from "@/components/ui/button"
import { AuthCard } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useTheme } from "next-themes"
import { ThemeSwitcher, ThemeSwitcherProps } from "@/components/ui/kibo-ui/theme-switcher"

export function AuthView({ pathname }: { pathname: string }) {
    // const { theme, setTheme } = useTheme();

    return (
        <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
            {/* Left side - Background Image */}
            <div className="hidden bg-[url('/bg-light.jpg')] bg-center bg-cover bg-no-repeat lg:block dark:bg-[url('/bg-night.jpg')]" />

            {/* Right side - Auth Content */}
            <div className="relative flex flex-col items-center justify-center gap-4 p-4 sm:p-6 md:p-8">
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                    <Link href="/">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Button>
                    </Link>
                </div>
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                    <ThemeSwitcher />
                </div>
                <div className="flex w-full max-w-sm items-center justify-center gap-4 sm:max-w-md lg:max-w-lg">
                    <AuthCard pathname={pathname} />
                </div>
                <div className="absolute right-4 bottom-4 left-4 flex flex-col items-center gap-2 sm:right-6 sm:bottom-6 sm:left-6">
                    <p className="hidden px-2 text-center text-muted-foreground text-xs leading-relaxed sm:block sm:text-sm">
                        {/* World is sleeping, meanwhile check out our */}
                        <Link href="/privacy-policy" className="underline hover:text-primary">
                            privacy policy
                        </Link>{" "}
                        {/* page :D */}
                    </p>
                </div>
            </div>
        </main>
    )
}