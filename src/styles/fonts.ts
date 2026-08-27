import localFont from "next/font/local";

/**
 * 기본 한글 글꼴. 외부 네트워크 요청 없이 저장소 자산으로 self-hosting 한다.
 * Playwright PDF 생성처럼 오프라인에 가까운 환경에서도 동일한 글꼴로 렌더링하기 위한 결정이다.
 */
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  style: "normal",
  display: "swap",
  variable: "--font-pretendard",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "system-ui",
    "Segoe UI",
    "Apple SD Gothic Neo",
    "Malgun Gothic",
    "sans-serif",
  ],
});
