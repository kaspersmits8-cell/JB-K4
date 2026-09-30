import "./globals.css";
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";
export const dynamic = "force-dynamic";
import { copy } from "../ui/copy.ts";

const sans = IBM_Plex_Sans({
  weight: ["400", "500"],
  style: "normal",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
});
const serif = IBM_Plex_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-ibm-plex-serif",
});
const mono = IBM_Plex_Mono({
  weight: "400",
  style: "normal",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

export const metadata = { title: copy.app, description: "Evidence-led payroll case decisions." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}><body>{children}</body></html>;
}
