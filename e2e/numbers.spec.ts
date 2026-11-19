import { expect, test } from "@playwright/test";
import { paidUser } from "./helpers";

test("viesim — tikai 1. moduļa kartītes", async ({ page }) => {
  await page.goto("/skaitli");
  await expect(page.getByRole("heading", { name: /^Bez maksas — \d+ no \d+ kartītēm$/ })).toBeVisible();
});

test("skaitļu kartītes: apgriež, atzīmē, filtrē un rāda sarakstu", async ({ page }) => {
  await paidUser(page, "num");
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
