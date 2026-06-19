import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ValidationErrors } from "@/components/ValidationErrors";

describe("ValidationErrors", () => {
  it("renders nothing when issue list is empty", () => {
    const { container } = render(<ValidationErrors issues={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one item per issue with field and message", () => {
    render(
      <ValidationErrors
        issues={[
          { field: "candidateId", message: "Required" },
          { field: "birthDate", message: "Invalid date" },
        ]}
      />,
    );

    expect(screen.getByText("candidateId")).toBeDefined();
    expect(screen.getByText("Required")).toBeDefined();
    expect(screen.getByText("birthDate")).toBeDefined();
    expect(screen.getByText("Invalid date")).toBeDefined();
  });

  it("supports custom title", () => {
    render(
      <ValidationErrors
        title="Form has 2 issues"
        issues={[{ field: "x", message: "y" }]}
      />,
    );
    expect(screen.getByText("Form has 2 issues")).toBeDefined();
  });
});
