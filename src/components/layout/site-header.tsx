import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

const links = [
  ["服務", "/services"],
  ["設計師", "/barbers"],
  ["作品", "/works"],
  ["關於", "/about"],
  ["聯絡", "/contact"]
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="DUM BARBERSHOP 首頁">
        <span>DUM</span><small>BARBERSHOP</small>
      </Link>
      <nav aria-label="主要導覽">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <ButtonLink href="/booking" compact>預約入口</ButtonLink>
    </header>
  );
}
