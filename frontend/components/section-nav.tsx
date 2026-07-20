"use client";

export interface SectionNavItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export function SectionNav({ items }: { items: SectionNavItem[] }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 overflow-x-auto border-b bg-background/95 px-4 backdrop-blur md:-mx-6 md:px-6">
      <nav className="flex w-max min-w-full gap-1 py-2">
        {items.map((item) =>
          item.disabled ? (
            <span
              key={item.id}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground/40"
            >
              {item.label}
            </span>
          ) : (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          )
        )}
      </nav>
    </div>
  );
}
