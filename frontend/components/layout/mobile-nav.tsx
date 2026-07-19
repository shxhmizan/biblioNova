"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, History, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/analyze", label: "Analyze", icon: FilePlus2 },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/about", label: "About", icon: Info },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/analyze" ? pathname === "/analyze" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs",
              active ? "text-primary" : "text-sidebar-foreground/60"
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
