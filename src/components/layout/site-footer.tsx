import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><strong>DUM BARBERSHOP</strong><p>官方網站 · 線上預約 · 多人工作室營運</p></div>
      <div className="footer-links"><Link href="/services">服務</Link><Link href="/barbers">設計師</Link><Link href="/works">作品</Link></div>
      <div className="footer-links"><Link href="/booking/manage">查詢預約</Link><Link href="/membership">會員預留</Link><Link href="/policies">政策</Link><Link href="/contact">聯絡</Link></div>
      <p className="muted">本機完整功能預覽。人物、地址、價格、政策與外部連結均為虛構、停用或明確佔位。</p>
    </footer>
  );
}
