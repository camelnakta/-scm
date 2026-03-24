import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "공정 흐름 SCM 시스템",
  description: "공정 흐름 통합 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
