import { describe, expect, it } from "vitest";
import { parseLockerFile, serializeLockerFile, type LockerEntry } from "./locker";
import { emptyItem } from "./wsg/factory";

describe("locker file", () => {
  it("round-trips locker JSON", () => {
    const entries: LockerEntry[] = [
      {
        id: "a1",
        name: "Rose shield",
        comment: "keep",
        rating: 5,
        item: emptyItem(),
      },
    ];
    const parsed = parseLockerFile(serializeLockerFile(entries));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("Rose shield");
    expect(parsed[0].item.kind).toBe("item");
  });

  it("rejects locker JSON without gear parts", () => {
    expect(() => parseLockerFile(JSON.stringify([{ name: "broken" }]))).toThrow(/missing gear data/);
  });
});
