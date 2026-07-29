import Link from "next/link";

const links = [
  ["首頁", "/"],
  ["預約", "/booking"],
  ["員工", "/staff/login"],
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
      <details className="mobile-menu">
        <summary>選單</summary>
        <div>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div>
      </details>
    </header>
  );
}
