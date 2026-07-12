import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { branch, services, staff } from "@/data/mock-data";

const staticPages = {
  services: { eyebrow: "SERVICES / MOCK DATA", title: "SERVICES BUILT AROUND CRAFT.", intro: "以下為 M1 虛構服務目錄；正式名稱、價格與服務時間仍待 Owner 決策。" },
  barbers: { eyebrow: "THE CREW / FICTIONAL", title: "ONE STUDIO. DISTINCT HANDS.", intro: "多人設計師是核心模型，每位設計師有獨立服務能力與預約時段。" },
  works: { eyebrow: "WORKS / VISUAL PLACEHOLDERS", title: "FORM. TEXTURE. DISCIPLINE.", intro: "作品頁目前以分類與版面佔位，不使用未授權的真實照片。" },
  membership: { eyebrow: "MEMBERSHIP / RESERVED", title: "MEMBERSHIP, NOT YET DEFINED.", intro: "第一階段只保留入口與資料模型，不提供登入、儲值、點數或正式權益。" },
  about: { eyebrow: "ABOUT / DUM", title: "BUILT FOR THE SHOP FLOOR.", intro: "DUM 的數位平台同時服務品牌入口、客人預約與多人工作室營運。" },
  contact: { eyebrow: "CONTACT / MOCK DETAILS", title: "FIND THE STUDIO.", intro: "本頁所有地址、電話與社群資訊皆為虛構展示資料。" },
  policies: { eyebrow: "POLICIES / OWNER DECISION", title: "CLEAR WHERE DECIDED. HONEST WHERE NOT.", intro: "未核准的營運政策明確保留，不發布假規則或影響客人權益的自動決策。" }
} as const;

export function generateStaticParams() { return Object.keys(staticPages).map((slug) => ({ slug })); }

export default function StaticPage({ params }: { params: { slug: string } }) {
  const page = staticPages[params.slug as keyof typeof staticPages];
  if (!page) notFound();
  return <PageShell {...page}><PageContent slug={params.slug} /></PageShell>;
}

function PageContent({ slug }: { slug: string }) {
  if (slug === "services") return <section className="content-band container"><div className="info-list">{services.map((item, i) => <div className="info-row" key={item.id}><span>0{i + 1}</span><div><h3>{item.name}</h3><p className="muted">{item.description}</p></div><div>{item.durationMinutes} MIN · {item.priceLabel}</div></div>)}</div></section>;
  if (slug === "barbers") return <section className="content-band container"><div className="grid grid-3">{staff.map((item, i) => <article className="card poster" data-mark={`0${i + 1}`} key={item.id}><p className="eyebrow">{item.title}</p><h3>{item.displayName}</h3><p>{item.specialties.join(" · ")}</p><Link className="button button-small" href="/booking">選擇此設計師</Link></article>)}</div></section>;
  if (slug === "works") return <section className="content-band container"><div className="grid grid-4">{["SKIN FADE", "CLASSIC CROP", "TEXTURE", "SIDE PART", "BUZZ CUT", "SHAVE", "DARK TONE", "TRANSFORM"].map((name, i) => <article className="card poster" data-mark={`${i + 1}`} key={name}><p className="eyebrow">MOCK CATEGORY</p><h3>{name}</h3></article>)}</div></section>;
  if (slug === "membership") return <section className="content-band container"><div className="card"><p className="eyebrow">RESERVED FEATURE</p><h2>COMING AFTER OWNER APPROVAL.</h2><p>會員等級、儲值、點數、次數、到期與權益都尚未定案。目前介面不會建立帳號或收取任何款項。</p></div></section>;
  if (slug === "about") return <section className="content-band container"><div className="grid grid-3"><article className="card"><span className="card-number">01</span><h3>BRAND</h3><p>深色、硬派、成熟，避免廉價模板感。</p></article><article className="card"><span className="card-number">02</span><h3>BOOKING</h3><p>免登入、多人設計師、供應商可替換。</p></article><article className="card"><span className="card-number">03</span><h3>OPERATIONS</h3><p>手機優先，讓店內節奏保持清楚。</p></article></div></section>;
  if (slug === "contact") return <section className="content-band container"><div className="info-list"><div className="info-row"><span>01</span><h3>ADDRESS</h3><p>{branch.address}</p></div><div className="info-row"><span>02</span><h3>PHONE</h3><p>{branch.phone}（虛構）</p></div><div className="info-row"><span>03</span><h3>HOURS</h3><p>TODO(owner-decision)</p></div></div></section>;
  return <section className="content-band container"><div className="grid grid-3"><article className="card"><h3>訂金政策</h3><p>訂金非全面強制；金額、退款與適用服務待 Owner 決策。</p></article><article className="card"><h3>取消與遲到</h3><p>期限、遲到、爽約與插單規則待 Owner 決策。</p></article><article className="card"><h3>隱私與資料</h3><p>採最少必要資料原則；保存期限與員工權限待 Owner 決策。</p></article></div></section>;
}
