import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DUM BARBERSHOP Platform Preview",
    short_name: "DUM",
    description: "Local Mock preview for the DUM website, booking and multi-staff operations platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#090909",
    theme_color: "#090909",
    lang: "zh-Hant",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
