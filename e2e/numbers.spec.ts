import { expect, test } from "@playwright/test";

test("skaitļu kartītes: apgriež, atzīmē, filtrē un rāda sarakstu", async ({ page }) => {
  await page.goto("/skaitli");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1, name: "Skaitļi, kas jāatceras" })).toBeVisible();
  await page.getByRole("button", { name: /nospied, lai redzētu/ }).click();
  await page.getByRole("button", { name: "Zinu" }).click();
  await expect(page.getByText("Zini: 1")).toBeVisible();
  await page.getByLabel("Modulis").selectOption("M6");
  await expect(page.getByText(/^1 no \d+$/)).toBeVisible();
  await page.getByRole("button", { name: "Saraksts" }).click();
  await expect(page.getByText("> 100 000 patronu")).toBeVisible();
});
