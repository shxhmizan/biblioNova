"use client";

export interface SectionNavItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export function SectionNav({ items }: { items: SectionNavItem[] }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 overflow-x-auto border-b border-border bg-card/80 px-4 shadow-[inset_0_-1px_0_var(--surface-highlight)] backdrop-blur-xl md:-mx-6 md:px-6">
      <nav className="flex w-max min-w-full gap-1.5 py-2.5">
        {items.map((item) =>
          item.disabled ? (
            <span
              key={item.id}
              className="shrink-0 rounded-lg border border-transparent px-3 py-1.5 text-sm text-muted-foreground/40"
            >
              {item.label}
            </span>
          ) : (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-lg border border-transparent px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground hover:shadow-[inset_0_1px_0_var(--surface-highlight)] focus-visible:outline-2 focus-visible:outline-ring"
            >
              {item.label}
            </a>
          )
        )}
      </nav>
    </div>
  );
}
