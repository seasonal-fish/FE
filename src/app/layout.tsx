import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "요즘애드 — 광고 카피 리스크 검토 서비스",
  description:
    "광고 문구·포스터를 넣으면 사회적·역사적으로 민감하게 해석될 위험을 자동 진단해주는 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F7F7F8]">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
