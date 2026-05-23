import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "بوابة الامتحانات - ماكدونالدز",
  description: "نظام امتحانات الكرو - ماكدونالدز مصر",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
