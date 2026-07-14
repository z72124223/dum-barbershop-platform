import { ButtonLink } from "@/components/ui/button";
import { PlaceholderGrid } from "@/components/public/placeholder-grid";
import { barberPlaceholders, servicePlaceholders, workPlaceholders } from "@/components/public/content";
import { Section } from "@/components/ui/section";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content container">
          <p className="eyebrow">TAIPEI · MULTI-BARBER PLATFORM · M1 PLACEHOLDER</p>
          <h1>CUT WITH<br /><span>CONVICTION.</span></h1>
          <p className="hero-copy">DUM 的深色品牌入口與多人工作室平台骨架。現階段所有內容均為虛構或佔位，不代表正式營運資訊。</p>
          <div className="hero-actions"><ButtonLink href="/booking">前往 Mock 預約入口</ButtonLink><ButtonLink href="/works" variant="secondary">查看作品分類</ButtonLink></div>
        </div>
        <span className="hero-index" aria-hidden="true">01</span>
      </section>
      <Section eyebrow="SERVICES / PLACEHOLDERS" title="SHARP BY DESIGN." intro="正式服務名稱、價格與時間均保留 Owner 決策。"><PlaceholderGrid items={servicePlaceholders} label="服務佔位" /></Section>
      <Section eyebrow="THE CREW / FICTIONAL" title="MULTI-STAFF FROM DAY ONE." intro="版面從第一天支援多位設計師，但不發布任何未核准員工資料。"><PlaceholderGrid items={barberPlaceholders} label="設計師佔位" /></Section>
      <Section eyebrow="WORKS / NO REAL CUSTOMER DATA" title="FORM. TEXTURE. DISCIPLINE." intro="作品區只呈現分類方向，等待正式授權素材。"><PlaceholderGrid items={workPlaceholders} label="作品佔位" /></Section>
    </main>
  );
}
