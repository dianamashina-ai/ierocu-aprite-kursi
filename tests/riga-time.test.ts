import { describe, expect, it } from "vitest";
import { dateToRigaLocal, rigaLocalToDate } from "@/lib/format";

describe("Rīgas laiks (datetime-local)", () => {
  it("ziemas laiks UTC+2, vasaras UTC+3; abos virzienos", () => {
    expect(rigaLocalToDate("2026-12-12T10:00")?.toISOString()).toBe("2026-12-12T08:00:00.000Z");
    expect(rigaLocalToDate("2026-07-01T10:00")?.toISOString()).toBe("2026-07-01T07:00:00.000Z");
    expect(dateToRigaLocal(new Date("2026-12-12T08:00:00Z"))).toBe("2026-12-12T10:00");
    expect(rigaLocalToDate("nav")).toBeNull();
  });
});
