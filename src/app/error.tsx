"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="loading-shell"><div><p className="eyebrow">LOCAL ERROR STATE</p><h2>SOMETHING WENT WRONG.</h2><p className="muted">此為 M1 基礎錯誤狀態，不會將錯誤靜默隱藏。</p><button className="button" onClick={reset}>重新嘗試</button></div></main>;
}
