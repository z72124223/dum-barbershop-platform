import type { Metadata, Viewport } from "next";
import "./globals.css";

const description = "DUM BARBERSHOP 客戶預約與員工工作台第一版靜態 MVP。";

export async function generateMetadata(): Promise<Metadata> {
  const origin = process.env.DUM_PUBLIC_BASE_URL === "https://dumbarbershop.com"
    ? process.env.DUM_PUBLIC_BASE_URL
    : "http://localhost:3000";
  const socialImage = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: { default: "DUM BARBERSHOP", template: "%s — DUM BARBERSHOP" },
    description,
    applicationName: "DUM BARBERSHOP",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "DUM BARBERSHOP", statusBarStyle: "black-translucent" },
    icons: { icon: "/icon.svg", apple: "/icon.svg" },
    openGraph: {
      type: "website",
      title: "DUM BARBERSHOP",
      description,
      url: origin,
      images: [{ url: socialImage, width: 1792, height: 939, alt: "DUM BARBERSHOP 第一版 MVP" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "DUM BARBERSHOP",
      description,
      images: [socialImage],
    },
  };
}

export const viewport: Viewport = { themeColor: "#0b0b0b", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
