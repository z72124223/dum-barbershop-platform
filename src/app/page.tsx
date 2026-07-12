import Link from "next/link";
import { services, staff } from "@/data/mock-data";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content container">
          <p className="eyebrow">TAIPEI · MULTI-BARBER STUDIO · MOCK MODE</p>
          <h1>CUT WITH<br /><span>CONVICTION.</span></h1>
          <p className="hero-copy">DUM 不只是一張椅子。我們把品牌、作品、多人預約與店內節奏放進同一套深色數位平台。</p>
          <div className="hero-actions"><Link className="button" href="/booking">開始 Mock 預約</Link><Link className="button button-secondary" href="/works">查看作品方向</Link></div>
        </div>
        <span className="hero-index" aria-hidden="true">01</span>
      </section>

      <section className="section container">
        <div className="section-heading"><div><p className="eyebrow">SERVICES / MOCK CATALOG</p><h2>SHARP BY DESIGN.</h2></div><p>第一階段全部使用虛構名稱、價格與服務時間。正式內容需經 Owner 核准。</p></div>
        <div className="grid grid-3">{services.slice(0, 3).map((service, index) => <article className="card" key={service.id}><span className="card-number">0{index + 1}</span><h3>{service.name}</h3><p>{service.description}</p><div className="card-meta"><span>{service.durationMinutes} MIN</span><span>{service.priceLabel}</span></div></article>)}</div>
      </section>

      <section className="section container">
        <div className="section-heading"><div><p className="eyebrow">THE CREW / FICTIONAL PROFILES</p><h2>MULTI-STAFF FROM DAY ONE.</h2></div><p>每位設計師有獨立服務能力與預約關聯，核心模型不以單人工作室為前提。</p></div>
        <div className="grid grid-3">{staff.map((member, index) => <article className="card poster" data-mark={`0${index + 1}`} key={member.id}><p className="eyebrow">{member.title}</p><h3>{member.displayName}</h3><p>{member.specialties.join(" · ")}</p></article>)}</div>
      </section>

      <section className="section container">
        <div className="section-heading"><div><p className="eyebrow">OPERATIONS / LOCAL PROTOTYPE</p><h2>THE SHOP, IN ONE VIEW.</h2></div><p>手機優先 Staff Prototype 提供今日行程、下一位客人、搜尋、封鎖時段與完成操作。</p></div>
        <div className="hero-actions"><Link className="button" href="/staff">開啟員工介面</Link><Link className="button button-secondary" href="/about">了解架構方向</Link></div>
      </section>
    </main>
  );
}
