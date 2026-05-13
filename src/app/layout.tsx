import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrePro Studio | 기획서·촬영표·콜시트·콘티 제작 툴",
  description: "영화, 광고, 뮤직비디오, 댄스커버, 행사 촬영을 위한 무로그인 BYOK 프리프로덕션 툴. 기획서, 촬영표, 콜시트, 장소/날씨, 예산, 콘티, 리포트를 한 번에 정리합니다.",
  keywords: ["일촬표", "콜시트", "프리프로덕션", "영상제작", "스토리보드", "콘티", "촬영준비", "뮤직비디오", "댄스커버", "Call Sheet", "Pre-production"],
  metadataBase: new URL("https://prepro-studio.vercel.app"),
  openGraph: {
    title: "PrePro Studio | No-login Production Planning Suite",
    description: "영화, 광고, MV, 댄스커버, 행사 촬영의 기획서, 촬영표, 콜시트, 콘티, 예산, 리포트를 한 번에 정리합니다.",
    url: "https://prepro-studio.vercel.app",
    siteName: "PrePro Studio",
    images: [
      {
        url: "/og-image.png?v=20260512",
        width: 1200,
        height: 630,
        alt: "PrePro Studio preview image",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrePro Studio | No-login Production Planning Suite",
    description: "영화, 광고, MV, 댄스커버, 행사 촬영의 기획서, 촬영표, 콜시트, 콘티, 예산, 리포트를 한 번에 정리합니다.",
    images: ["/og-image.png?v=20260512"],
  },
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
