import { PublicPage } from "@/components/public/public-page";

export const metadata = { title: "聯絡" };

export default function ContactPage() {
  return <PublicPage eyebrow="CONTACT / PLACEHOLDER" title="FIND THE STUDIO." intro="正式地址、電話、社群、營業時間與地圖尚未核准，本頁只呈現安全佔位。"><div className="info-list"><div className="info-row"><span>01</span><h3>ADDRESS</h3><p>TODO(owner-decision)</p></div><div className="info-row"><span>02</span><h3>PHONE / LINE</h3><p>TODO(owner-decision)</p></div><div className="info-row"><span>03</span><h3>OPENING HOURS</h3><p>TODO(owner-decision)</p></div></div></PublicPage>;
}
