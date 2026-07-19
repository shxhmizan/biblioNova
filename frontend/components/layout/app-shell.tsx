import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden md:flex md:w-60 md:flex-shrink-0 md:border-r md:border-sidebar-border">
        <Sidebar className="w-60" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-14 md:pb-0">
        <main className="flex-1">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
