import { expect, type Page } from "@playwright/test";

export const uniqueEmail = (tag: string) => `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

export async function signUp(page: Page, email: string) {
  await page.goto("/registreties");
  await page.getByLabel("E-pasts").fill(email);
  await page.getByLabel(/Parole/).fill("drosa-parole-123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Izveidot kontu" }).click();
  await expect(page).toHaveURL(/\/panelis$/);
}

/** Iegādājas pilnu piekļuvi ar testa maksājumu (PAYMENT_PROVIDER=dev). */
export async function buyAccess(page: Page, name = "Testa Pircējs") {
  await page.goto("/iegadaties");
  await page.getByLabel("Vārds, uzvārds (rēķinam)").fill(name);
  await page.getByRole("checkbox", { name: /lietošanas un pirkšanas noteikumiem/ }).check();
  await page.getByRole("checkbox", { name: /atteikuma tiesības/ }).check();
  await page.getByRole("button", { name: /^Maksāt/ }).click();
  await expect(page).toHaveURL(/\/maksajums\/tests\?order=/);
  await page.getByRole("button", { name: "Apmaksāt (tests)" }).click();
  await expect(page).toHaveURL(/\/maksajums\/rezultats\?order=/);
  await expect(page.getByRole("heading", { name: /Pilna piekļuve atvērta/ })).toBeVisible();
}

/** Jauns konts ar pilnu piekļuvi. */
export async function paidUser(page: Page, tag: string) {
  await signUp(page, uniqueEmail(tag));
  await buyAccess(page);
}

/** Iziet (telefonā poga ir izvēlnē). */
export async function signOut(page: Page) {
  const menu = page.getByRole("button", { name: "Atvērt izvēlni" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Iziet" }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/$/);
}
