import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state" role="status"><p className="eyebrow">PLACEHOLDER</p><h3>{title}</h3><p>{children}</p></div>;
}
