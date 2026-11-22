import { expect, test } from "@playwright/test";
import { buyAccess, signUp, uniqueEmail } from "./helpers";

test("viesis: 1. modulis prasa reģistrāciju, pārējie slēgti", async ({ page }) => {
  await page.goto("/tema/1-1/trenins");
  await expect(page).toHaveURL(/\/registreties\?next=%2Ftema%2F1-1%2Ftrenins$/);
  await page.goto("/modulis/M1");
  await expect(page).toHaveURL(/\/registreties\?next=%2Fmodulis%2FM1$/);
  await page.goto("/tema/5-3/trenins");
  await expect(page.getByRole("heading", { name: "Šī daļa pieejama ar pilnu piekļuvi" })).toBeVisible();
  await expect(page.locator("fieldset")).toHaveCount(0);
  await page.goto("/jautajums/176");
  await expect(page.getByRole("heading", { name: /Atbilde un skaidrojums pieejami/ })).toBeVisible();
  await page.goto("/eksamens");
  await expect(page.getByRole("link", { name: "Iegūt pilnu piekļuvi" })).toBeVisible();
});

test("pirkums: forma prasa piekrišanu → testa maksājums → piekļuve un rēķins", async ({ page }) => {
  await signUp(page, uniqueEmail("buy"));
  await page.goto("/tema/5-3/trenins");
  await expect(page.getByRole("heading", { name: "Šī daļa pieejama ar pilnu piekļuvi" })).toBeVisible();

  // bez piekrišanas forma netiek iesniegta (pārlūka required)
  await page.goto("/iegadaties");
  await expect(page.getByText("120,00 €").first()).toBeVisible();
  await page.getByLabel("Vārds, uzvārds (rēķinam)").fill("Jānis Bērziņš");
  await page.getByRole("button", { name: /^Maksāt/ }).click();
  await expect(page).toHaveURL(/\/iegadaties$/);

  await buyAccess(page, "Jānis Bērziņš");
  await page.getByRole("link", { name: "Skatīt rēķinu" }).click();
  await expect(page.getByRole("heading", { name: /PVN rēķins Nr\. IE-\d{4}-\d{5}/ })).toBeVisible();
  await expect(page.locator("article").getByText("LV40103643291")).toBeVisible();
  await expect(page.getByText("99,17 €").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("20,83 €")).toBeVisible();

  await page.goto("/tema/5-3/trenins");
  await expect(page.locator("fieldset button").first()).toBeVisible();
  await page.goto("/iegadaties");
  await expect(page.getByText("Tev jau ir pilna piekļuve kursam.")).toBeVisible();
});
