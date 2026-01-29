"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Map,
  Users,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Home,
  Shield,
  Mic,
  Github,
  Menu,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Dock, DockIcon } from "@/components/magicui/dock";

export function Navigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const centerNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/report", label: "Report Issue", icon: PlusCircle },
    { href: "/map", label: "Map", icon: Map },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/voice-agent", label: "Voice Agent", icon: Mic },
    { href: "/team", label: "Team", icon: Users },
  ];

  const authItems = [
    { href: "/login", label: "Login" },
    { href: "/signup", label: "Sign Up" },
  ];

  return (
    <header className="sticky top-0 z-[100] w-full bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - Left */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative size-8 sm:size-10 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="OurStreet Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-base sm:text-lg font-semibold text-black dark:text-white hidden xs:inline">
            OurStreet
          </span>
        </Link>

        {/* Center Navigation - Desktop only */}
        <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-fit">
          <TooltipProvider>
            <Dock direction="middle" magnification={50} distance={120}>
              {centerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <DockIcon key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          aria-label={item.label}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "size-10 rounded-full",
                            isActive &&
                              "bg-gray-100 dark:bg-gray-900 text-black dark:text-white",
                          )}
                        >
                          <Icon className="size-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </DockIcon>
                );
              })}
            </Dock>
          </TooltipProvider>
        </div>

        {/* Right Side - Actions & Mobile Menu */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 sm:gap-2">
            {isAuthenticated && user?.role === "admin" && (
              <Link href="/admin">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm font-medium border-2 hover:bg-gray-100 dark:hover:bg-gray-900 bg-white dark:bg-black"
                >
                  <Shield className="mr-1.5 size-3.5 sm:size-4" />
                  Admin
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm font-medium bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 hidden md:flex"
              >
                <LogOut className="mr-1.5 size-3.5 sm:size-4" />
                Logout
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                {authItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: item.label === "Sign Up" ? "default" : "ghost", size: "sm" }),
                      "h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm font-medium",
                      item.label === "Sign Up" && "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <a
            href="https://github.com/NoahMenezes/nit_goa_hackathon1"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "size-8 sm:size-10 rounded-full"
            )}
          >
            <Github className="size-4 sm:size-5" />
          </a>
          <ThemeToggle />

          {/* Mobile Menu Trigger */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 sm:size-10">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] max-w-[300px] border-l border-gray-200 dark:border-gray-800">
                <SheetHeader className="text-left py-4">
                  <SheetTitle className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Logo" width={24} height={24} />
                    OurStreet
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase text-gray-400 px-2">Navigation</p>
                    {centerNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "bg-gray-100 dark:bg-gray-900 text-black dark:text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                        )}
                      >
                        <item.icon className="size-5" />
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase text-gray-400 px-2">Account</p>
                    {isAuthenticated ? (
                      <>
                        {user?.role === "admin" && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          >
                            <Shield className="size-5" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={logout}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="size-5" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {authItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              buttonVariants({ variant: item.label === "Sign Up" ? "default" : "outline", size: "sm" }),
                              "w-full px-2 text-xs",
                              item.label === "Sign Up" && "bg-black dark:bg-white text-white dark:text-black"
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
