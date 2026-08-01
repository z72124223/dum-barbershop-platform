import Link from "next/link";

export default function NotFound() {
  return (
    <main className="loading-shell">
      <div>
        <p className="eyebrow">404</p>
        <h1>找不到這個頁面。</h1>
        <Link className="button" href="/">返回首頁</Link>
      </div>
    </main>
  );
}
