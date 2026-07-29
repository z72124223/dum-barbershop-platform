"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="loading-shell"><div><p className="eyebrow">ERROR</p><h2>剛才出了點狀況。</h2><p className="muted">請重新整理，或按下方按鈕再試一次。</p><button className="button" onClick={reset}>重新嘗試</button></div></main>;
}
