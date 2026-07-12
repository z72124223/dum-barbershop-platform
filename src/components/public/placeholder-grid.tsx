import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type PlaceholderItem = { title: string; body: string; meta?: string };

export function PlaceholderGrid({ items, label }: { items: PlaceholderItem[]; label: string }) {
  return <div className="grid grid-3">{items.map((item, index) => <Card key={item.title}><span className="card-number">{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p>{item.meta ? <Badge>{item.meta}</Badge> : null}<span className="sr-only">{label}</span></Card>)}</div>;
}
