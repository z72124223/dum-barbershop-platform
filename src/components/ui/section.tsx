import type { ReactNode } from "react";
import { Container } from "./container";

export function Section({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  return <section className="section"><Container><div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{intro ? <p>{intro}</p> : null}</div>{children}</Container></section>;
}
