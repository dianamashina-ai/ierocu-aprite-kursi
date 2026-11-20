import { expect, test } from "@playwright/test";
import { buyAccess, signInAdmin, signUp, uniqueEmail } from "./helpers";

test("administrācija: parastam lietotājam nav pieejama", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/pieslegties/);
  await signUp(page, uniqueEmail("nav-admins"));
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("administrācija: pasūtījums redzams, atmaksa slēdz piekļuvi", async ({ browser }) => {
  test.setTimeout(90_000);
  const buyerEmail = uniqueEmail("atmaksa");
  const buyerCtx = await browser.newContext();
  const buyer = await buyerCtx.newPage();
  await signUp(buyer, buyerEmail);
  await buyAccess(buyer, "Atmaksas Pircējs");

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await signInAdmin(admin);
  await admin.goto("/admin");
  await expect(admin.getByRole("heading", { name: "Pārskats" })).toBeVisible();
  await admin.goto(`/admin/pasutijumi?q=${encodeURIComponent(buyerEmail)}`);
  const row = admin.locator("li", { hasText: buyerEmail });
  await expect(row.getByText("Apmaksāts")).toBeVisible();
  await row.getByRole("button", { name: "Atmaksāt" }).click();
  await row.getByRole("button", { name: "Jā, atmaksāt" }).click();
  // pēc atmaksas rinda atjaunojas: statuss “Atmaksāts”, pogas vairs nav
  await expect(row.getByText("Atmaksāts", { exact: true })).toBeVisible();
  await expect(row.getByRole("button", { name: "Atmaksāt" })).toHaveCount(0);
  await admin.reload();
  await expect(admin.locator("li", { hasText: buyerEmail }).getByText("Atmaksāts", { exact: true })).toBeVisible();

  await buyer.goto("/konts");
  await expect(buyer.getByText("Tev pieejams 1. modulis")).toBeVisible();
  await buyerCtx.close();
  await adminCtx.close();
});

test("administrācija: skaidrojumu saraksts un redaktors", async ({ page }) => {
  await signInAdmin(page);
  await page.goto("/admin/skaidrojumi?modulis=M1");
  await page.getByRole("link", { name: /Nr\. 422/ }).click();
  await expect(page.getByText("Pareizā atbilde")).toBeVisible();
  await page.getByRole("button", { name: "Saglabāt kā melnrakstu" }).click();
  await expect(page.getByRole("status")).toHaveText("Saglabāts kā melnraksts.");
});
