"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="loading-shell"><div><p className="eyebrow">LOCAL ERROR STATE</p><h2>SOMETHING WENT WRONG.</h2><p className="muted">系統不會把錯誤靜默隱藏；可安全重試，所有正式外部寫入仍為停用。</p><button className="button" onClick={reset}>重新嘗試</button></div></main>;
}
