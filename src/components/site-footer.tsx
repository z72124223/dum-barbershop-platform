import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><strong>DUM BARBERSHOP</strong><p>網站、預約與多人工作室營運平台 — M1 Mock Prototype</p></div>
      <div className="footer-links"><Link href="/contact">聯絡</Link><Link href="/policies">政策</Link><Link href="/membership">會員預留</Link></div>
      <p className="muted">所有人物、電話、地址與預約資料均為虛構。</p>
    </footer>
  );
}
