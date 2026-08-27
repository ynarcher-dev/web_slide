import type { Metadata } from "next";
import { MotionProvider } from "@/components/layout/motion-provider";
import { pretendard } from "@/styles/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web Slide",
  description: "웹페이지를 슬라이드 안에서 시연하는 프레젠테이션 도구",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main-content" className="skip-link">
          본문으로 건너뛰기
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
