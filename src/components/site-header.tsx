import Link from "next/link";

const links = [
  ["服務", "/services"],
  ["設計師", "/barbers"],
  ["作品", "/works"],
  ["關於", "/about"],
  ["員工介面", "/staff"]
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
      <Link className="button button-small" href="/booking">立即預約</Link>
    </header>
  );
}
