import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo, LOGO_ASPECT_RATIO } from "./logo";

describe("Logo", () => {
  it("정적 자산 경로와 브랜드 이름을 사용한다", () => {
    render(<Logo />);

    const image = screen.getByRole("img", { name: "Y&ARCHER" });
    expect(image).toHaveAttribute(
      "src",
      expect.stringContaining("/brand/ynarcher-logo-horizontal.svg"),
    );
  });

  it("높이에 맞춰 원본 비율로 너비를 계산한다", () => {
    render(<Logo height={40} />);

    const image = screen.getByRole("img", { name: "Y&ARCHER" });
    expect(image).toHaveAttribute("height", "40");
    expect(image).toHaveAttribute("width", String(Math.round(40 * LOGO_ASPECT_RATIO)));
  });

  it("decorative이면 화면 낭독기에서 숨긴다", () => {
    render(<Logo decorative />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
