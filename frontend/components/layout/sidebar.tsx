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
    <div
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[inset_-1px_0_0_var(--surface-highlight),10px_0_30px_-24px_var(--surface-deep)] backdrop-blur-xl",
        className
      )}
    >
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5 text-sidebar-foreground"
      >
        <span className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-[inset_0_1px_0_rgb(255_255_255_/_0.18),0_5px_12px_-8px_var(--primary)]">
          <Network className="size-5" strokeWidth={2.25} />
        </span>
        <span>
          <span className="block font-semibold tracking-tight">BiblioAgent</span>
          <span className="block pt-0.5 text-[9px] font-semibold tracking-[0.18em] text-sidebar-foreground/45 uppercase">
            Research desk
          </span>
        </span>
      </Link>

      <div className="mx-5 metal-rule" />
      <nav className="flex flex-1 flex-col gap-1.5 px-3 pt-5">
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
                "flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm transition-all",
                active
                  ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-[inset_0_1px_0_var(--surface-highlight),0_7px_14px_-12px_var(--surface-deep)]"
                  : "text-sidebar-foreground/70 hover:border-sidebar-border/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-sidebar-border px-4 py-4 shadow-[inset_0_1px_0_var(--surface-highlight)]">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground shadow-[inset_0_1px_0_var(--surface-highlight)]">
            R
          </div>
          <span className="text-xs text-sidebar-foreground/60">Researcher</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
