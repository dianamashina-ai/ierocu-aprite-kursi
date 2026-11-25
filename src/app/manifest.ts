import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ieroču atļauja — sagatavošanās eksāmenam",
    short_name: "Ieroču atļauja",
    description: "Sagatavošanās Valsts policijas kvalifikācijas pārbaudījumam ieroču atļaujas saņemšanai.",
    lang: "lv",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6c3441",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icon1.png", type: "image/png", sizes: "192x192" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
    ],
  };
}
