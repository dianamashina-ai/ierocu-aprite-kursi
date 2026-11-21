import { expect, type Page } from "@playwright/test";

export const uniqueEmail = (tag: string) => `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

export async function signUp(page: Page, email: string) {
  await page.goto("/registreties");
  await page.getByLabel("E-pasts").fill(email);
  await page.getByLabel(/Parole/).fill("drosa-parole-123");
  await page.getByRole("button", { name: "Izveidot kontu" }).click();
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
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
  // sākumlapā jau varam būt — gaidām, līdz sesija tiešām beigusies
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-out") && r.ok()),
    page.getByRole("button", { name: "Iziet" }).filter({ visible: true }).first().click(),
  ]);
  await expect(page).toHaveURL(/\/$/);
}

export const ADMIN = "labotajs-e2e@example.com"; // playwright.config.ts → ADMIN_EMAILS

export async function signInAdmin(page: Page) {
  await page.goto("/registreties");
  await page.getByLabel("E-pasts").fill(ADMIN);
  await page.getByLabel(/Parole/).fill("drosa-parole-123");
  await page.getByRole("button", { name: "Izveidot kontu" }).click();
  // ja konts jau ir — pieslēdzamies
  if (!(await page.waitForURL(/^https?:\/\/[^/]+\/$/, { timeout: 4000 }).then(() => true, () => false))) {
    await page.goto("/pieslegties");
    await page.getByLabel("E-pasts").fill(ADMIN);
    await page.getByLabel("Parole").fill("drosa-parole-123");
    await page.getByRole("button", { name: "Pieslēgties" }).click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
  }
}
