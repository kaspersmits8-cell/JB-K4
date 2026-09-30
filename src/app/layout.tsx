import "./globals.css";
export const metadata = { title: "Trust Dossier", description: "Evidence-led payroll case decisions." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
