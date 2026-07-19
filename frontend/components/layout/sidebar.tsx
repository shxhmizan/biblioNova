"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, History, Info, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const NAV_ITEMS = [
  { href: "/analyze", label: "New Analysis", icon: FilePlus2 },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/about", label: "About", icon: Info },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground", className)}>
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-5 text-sidebar-foreground"
      >
        <Network className="size-5 text-primary" strokeWidth={2.25} />
        <span className="font-semibold tracking-tight">BiblioAgent</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/analyze"
              ? pathname === "/analyze"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
            R
          </div>
          <span className="text-xs text-sidebar-foreground/60">Researcher</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
