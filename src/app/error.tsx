"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="loading-shell"><div><p className="eyebrow">本機錯誤狀態</p><h2>剛才出了點狀況。</h2><p className="muted">系統不會把錯誤靜默隱藏；可安全重試，所有正式外部寫入仍為停用。</p><button className="button" onClick={reset}>重新嘗試</button></div></main>;
}
