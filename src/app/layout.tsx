import type { Metadata } from "next";
import "@fontsource-variable/public-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareChart EHR",
  description:
    "An electronic health record demo: patient charts, allergies, medications, vitals trends and SOAP visit notes. Fictional data only.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
