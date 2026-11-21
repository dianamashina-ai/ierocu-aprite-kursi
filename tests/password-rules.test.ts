import { describe, expect, it } from "vitest";
import { isStrongPassword, PASSWORD_RULES } from "@/lib/auth/password-rules";

describe("paroles prasības", () => {
  it("stipra parole: 8+ rakstzīmes, lielais burts, cipars, simbols", () => {
    expect(isStrongPassword("Drosa-Parole-123!")).toBe(true);
    expect(isStrongPassword("Āboli#2026")).toBe(true); // latviešu lielais burts
  });
  it("atsevišķi trūkumi", () => {
    expect(isStrongPassword("Ab1!")).toBe(false); // par īsu
    expect(isStrongPassword("drosa-parole-1")).toBe(false); // nav lielā burta
    expect(isStrongPassword("Drosa-Parole!")).toBe(false); // nav cipara
    expect(isStrongPassword("DrosaParole12")).toBe(false); // nav simbola
    expect(isStrongPassword("Drosa Parole 12")).toBe(false); // atstarpe nav simbols
  });
  it("katram noteikumam ir paskaidrojums", () => {
    expect(PASSWORD_RULES.map((r) => r.id)).toEqual(["len", "upper", "digit", "symbol"]);
  });
});
