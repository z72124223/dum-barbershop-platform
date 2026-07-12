import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { PageHero } from "./page-hero";

export function PublicPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <main><PageHero eyebrow={eyebrow} title={title} intro={intro} /><section className="content-band"><Container>{children}</Container></section></main>;
}
