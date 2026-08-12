import { ButtonLink } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content container">
          <p className="eyebrow">DUM BARBERSHOP</p>
          <h1>客戶預約</h1>
          <p className="hero-copy">共用時段 MVP；正式公開仍須等待 #37 GO。</p>
          <div className="hero-actions">
            <ButtonLink href="/booking">進入客戶預約</ButtonLink>
            <ButtonLink href="/staff/login" variant="secondary">員工登入</ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
