import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><strong>DUM BARBERSHOP</strong><p>Platform & Public Experience — M1 placeholder</p></div>
      <div className="footer-links"><Link href="/services">服務</Link><Link href="/barbers">設計師</Link><Link href="/works">作品</Link></div>
      <div className="footer-links"><Link href="/membership">會員預留</Link><Link href="/policies">政策</Link><Link href="/contact">聯絡</Link></div>
      <p className="muted">所有人物、地址、資訊與內容均為虛構或明確佔位。</p>
    </footer>
  );
}
