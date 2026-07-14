import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  compact?: boolean;
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", compact = false, className = "" }: ButtonLinkProps) {
  const classes = ["button", variant === "secondary" ? "button-secondary" : "", compact ? "button-small" : "", className].filter(Boolean).join(" ");
  return <Link className={classes} href={href}>{children}</Link>;
}
