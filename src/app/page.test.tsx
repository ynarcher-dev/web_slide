import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders the Web Slide heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Web Slide" })).toBeInTheDocument();
  });
});
