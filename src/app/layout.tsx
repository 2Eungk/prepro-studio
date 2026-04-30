import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrePro Studio | 올인원 영상 제작 일촬표 & 콘티 매니저",
  description: "영상 제작자를 위한 스마트한 프리프로덕션 도구. 영화, 드라마, 광고, 행사 등 장르별 맞춤형 일촬표 자동 생성 및 AI 콘티 매칭 서비스.",
  keywords: ["일촬표", "프리프로덕션", "영상제작", "스토리보드", "콘티", "촬영준비", "Call Sheet", "Pre-production"],
};

import GoogleAdSense from "@/components/GoogleAdSense";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <GoogleAdSense />
        {children}
      </body>
    </html>
  );
}
