import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DUM BARBERSHOP 平台預覽",
    short_name: "DUM",
    description: "DUM 官方網站、線上預約與多人工作室營運平台的本機示範版。",
    start_url: "/",
    display: "standalone",
    background_color: "#100b0b",
    theme_color: "#100b0b",
    lang: "zh-Hant",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
