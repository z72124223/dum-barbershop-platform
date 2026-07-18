import { ButtonLink } from "@/components/ui/button";
import { PlaceholderGrid } from "@/components/public/placeholder-grid";
import { reviewPlaceholders, shopFeaturePlaceholders, workPlaceholders } from "@/components/public/content";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { mockServices, mockStaff } from "@/data/mock";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content container">
          <p className="eyebrow">DUM BARBERSHOP · 美式黑色電影風格預覽</p>
          <h1>一刀，<br /><span>定下風格。</span></h1>
          <p className="hero-copy">黑色電影的沉著、老派理容的規矩，加上一套免登入、可指定設計師的預約流程。正式價格、人物、地址、照片與政策仍等待店家確認。</p>
          <div className="hero-actions"><ButtonLink href="/booking">立即開始預約</ButtonLink><ButtonLink href="/booking/manage" variant="secondary">查詢示範預約</ButtonLink><ButtonLink href="/works" variant="secondary">查看風格作品</ButtonLink></div>
        </div>
        <span className="hero-index" aria-hidden="true">01</span>
      </section>
      <Section eyebrow="免登入預約 · 本機示範" title="你的座位，你的選擇。" intro="先選服務，再指定設計師或由系統安排最早可用人員；完成後仍清楚標示為本機示範。"><div className="home-booking-band"><div><strong>6</strong><span>個清楚步驟</span></div><div><strong>3</strong><span>位虛構設計師</span></div><div><strong>0</strong><span>筆真實預約</span></div><ButtonLink href="/booking">開始預約示範</ButtonLink></div></Section>
      <Section eyebrow="服務項目 · 虛構預覽" title="俐落，從細節開始。" intro="精選版位使用虛構服務與時間驗證體驗；正式名稱、價格與內容仍保留店主決策。"><div className="grid grid-3">{mockServices.slice(0, 3).map((service, index) => <Card key={service.id} className="bookable-card"><span className="card-number">0{index + 1}</span><h3>{service.name}</h3><p>{service.description}</p><dl className="card-facts"><div><dt>示範時間</dt><dd>{service.durationMinutes} 分鐘</dd></div><div><dt>正式價格</dt><dd>等待決定</dd></div></dl><ButtonLink href={`/booking?service=${service.id}`} compact>選這項服務</ButtonLink></Card>)}</div><div className="section-link"><ButtonLink href="/services" variant="secondary">查看所有服務預覽</ButtonLink></div></Section>
      <Section eyebrow="精選作品 · 無真實顧客資料" title="輪廓、質感、紀律。" intro="作品首頁呈現分類與視覺節奏，沒有使用真實顧客照片。"><div className="work-preview-strip">{workPlaceholders.slice(0, 4).map((item, index) => <article key={item.title}><span>0{index + 1}</span><strong>{item.title}</strong><small>{item.meta}</small></article>)}</div><div className="section-link"><ButtonLink href="/works" variant="secondary">查看十種作品分類</ButtonLink></div></Section>
      <Section eyebrow="設計師陣容 · 虛構預覽" title="同一間店，各有一套手法。" intro="可指定人員、查看擅長項目與直接進入預約，但不發布任何未核准的真實員工身分。"><div className="crew-preview">{mockStaff.map((staff, index) => <article key={staff.id}><div className="portrait-placeholder" aria-label="虛構設計師照片佔位"><span>{String(index + 1).padStart(2, "0")}</span></div><p className="eyebrow">虛構設計師</p><h3>{staff.displayName}</h3><p>{staff.specialties.join(" · ")}</p><ButtonLink href={`/booking?staff=${staff.id}`} compact>指定預約</ButtonLink></article>)}</div><div className="section-link"><ButtonLink href="/barbers" variant="secondary">查看設計師預覽</ButtonLink></div></Section>
      <Section eyebrow="工作室特色 · 平台能力" title="為現場節奏而生。" intro="店內環境與品牌照片尚待提供；目前先完成可承載正式內容的結構。"><PlaceholderGrid items={shopFeaturePlaceholders} label="店內特色預覽" /></Section>
      <Section eyebrow="顧客評價 · 等待授權內容" title="信任，不靠虛構。" intro="網站已準備好評價區，但不捏造顧客姓名、星等或心得。"><PlaceholderGrid items={reviewPlaceholders} label="顧客評價佔位" /></Section>
      <Section eyebrow="到店資訊 · 等待店主決定" title="找到你的座位。" intro="正式地址、營業時間與地圖尚未核准；版面已保留並避免誤導訪客。"><div className="visit-grid"><article><span>門市地址</span><strong>等待店主決定</strong><p>正式門牌與交通資訊待店家提供。</p></article><article><span>營業時間</span><strong>等待店主決定</strong><p>不根據示範排班推測門市營業時間。</p></article><div className="map-placeholder"><span>地圖尚未啟用</span><strong>等待正式地圖位置</strong></div></div></Section>
      <Section eyebrow="聯絡方式 · 連結尚未啟用" title="保持聯絡。" intro="LINE、Instagram、電話與導航入口已配置版位；取得正式帳號與連結前不會導向錯誤對象。"><div className="contact-channel-grid">{[["LINE","官方 LINE"],["INSTAGRAM","Instagram"],["PHONE","聯絡電話"],["NAVIGATION","路線導航"]].map(([key,label]) => <article key={key}><span>{label}</span><strong>等待店家提供</strong><small>尚未啟用</small></article>)}</div><div className="section-link"><ButtonLink href="/contact" variant="secondary">查看聯絡與交通預覽</ButtonLink></div></Section>
    </main>
  );
}
