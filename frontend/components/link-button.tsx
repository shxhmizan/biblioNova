import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/** Button styled as a Next.js Link — Base UI's Button needs render+nativeButton=false for anchors. */
export function LinkButton({
  href,
  children,
  variant,
  size,
  className,
  ...linkProps
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof buttonVariants> &
  Omit<ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      nativeButton={false}
      render={
        <Link href={href} {...linkProps}>
          {children}
        </Link>
      }
    />
  );
}
