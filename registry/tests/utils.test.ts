import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, null, undefined, "b", { c: true, d: false })).toBe("a b c");
  });
  it("lets later tailwind utilities win conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("bg-brand", "bg-danger")).toBe("bg-danger");
    expect(cn("text-sm", "text-ink")).toBe("text-sm text-ink");
  });
  it("handles arrays", () => {
    expect(cn(["a", ["b"]], "c")).toBe("a b c");
  });
});
