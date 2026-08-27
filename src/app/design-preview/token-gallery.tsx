import { Logo } from "@/components/ui";
import { PreviewSection } from "./section";

const BRAND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const INK_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const BRAND_CLASS: Record<(typeof BRAND_STEPS)[number], string> = {
  50: "bg-brand-50",
  100: "bg-brand-100",
  200: "bg-brand-200",
  300: "bg-brand-300",
  400: "bg-brand-400",
  500: "bg-brand-500",
  600: "bg-brand-600",
  700: "bg-brand-700",
  800: "bg-brand-800",
  900: "bg-brand-900",
};

const INK_CLASS: Record<(typeof INK_STEPS)[number], string> = {
  50: "bg-ink-50",
  100: "bg-ink-100",
  200: "bg-ink-200",
  300: "bg-ink-300",
  400: "bg-ink-400",
  500: "bg-ink-500",
  600: "bg-ink-600",
  700: "bg-ink-700",
  800: "bg-ink-800",
  900: "bg-ink-900",
  950: "bg-ink-950",
};

const FONT_WEIGHTS = [
  { label: "Light 300", className: "font-light" },
  { label: "Regular 400", className: "font-normal" },
  { label: "Medium 500", className: "font-medium" },
  { label: "SemiBold 600", className: "font-semibold" },
  { label: "Bold 700", className: "font-bold" },
];

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`h-12 rounded-control border border-border-subtle ${className}`} />
      <span className="text-xs text-foreground-muted">{name}</span>
    </div>
  );
}

export function TokenGallery() {
  return (
    <>
      <PreviewSection
        title="로고"
        description="저장소 정적 자산으로 관리하는 고정 로고. 사용자가 교체하지 않는다."
      >
        <div className="flex flex-wrap items-end gap-8">
          {[20, 28, 40].map((height) => (
            <div key={height} className="flex flex-col items-start gap-2">
              <Logo height={height} />
              <span className="text-xs text-foreground-muted">height {height}px</span>
            </div>
          ))}
        </div>
      </PreviewSection>

      <PreviewSection title="브랜드 색상" description="Y&ARCHER 레드를 기준으로 한 brand 스케일">
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {BRAND_STEPS.map((step) => (
            <Swatch key={step} name={`brand-${step}`} className={BRAND_CLASS[step]} />
          ))}
        </div>
      </PreviewSection>

      <PreviewSection title="중립 색상" description="텍스트, 경계선, 배경에 사용하는 ink 스케일">
        <div className="grid grid-cols-6 gap-3 sm:grid-cols-11">
          {INK_STEPS.map((step) => (
            <Swatch key={step} name={`ink-${step}`} className={INK_CLASS[step]} />
          ))}
        </div>
      </PreviewSection>

      <PreviewSection title="타이포그래피" description="Pretendard Variable 자체 호스팅">
        <div className="flex flex-col gap-3">
          {FONT_WEIGHTS.map((weight) => (
            <p key={weight.label} className={`text-xl text-foreground ${weight.className}`}>
              웹 슬라이드 Web Slide 0123456789 · {weight.label}
            </p>
          ))}
        </div>
      </PreviewSection>
    </>
  );
}
