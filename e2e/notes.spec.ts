import { expect, test } from "@playwright/test";

const ADMIN = "labotajs-e2e@example.com"; // playwright.config.ts → ADMIN_EMAILS

async function signInAdmin(page: import("@playwright/test").Page) {
  await page.goto("/registreties");
  await page.getByLabel("E-pasts").fill(ADMIN);
  await page.getByLabel(/Parole/).fill("drosa-parole-123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Izveidot kontu" }).click();
  // ja konts jau ir — pieslēdzamies
  if (!(await page.waitForURL(/\/panelis$/, { timeout: 4000 }).then(() => true, () => false))) {
    await page.goto("/pieslegties");
    await page.getByLabel("E-pasts").fill(ADMIN);
    await page.getByLabel("Parole").fill("drosa-parole-123");
    await page.getByRole("button", { name: "Pieslēgties" }).click();
    await expect(page).toHaveURL(/\/panelis$/);
  }
}

test("viesim un parastam lietotājam poga Labot nav redzama", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Labot" })).toHaveCount(0);
  await page.goto("/labojumi");
  await expect(page).toHaveURL(/\/pieslegties/);
});

test("administrators atzīmē elementu, piezīme parādās sarakstā un uz lapas", async ({ page, isMobile }) => {
  test.skip(isMobile, "pietiek ar vienu projektu (koplietota piezīmju tabula)");
  await signInAdmin(page);
  await page.goto("/modulis/M1");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Labot" }).click();
  await page.getByRole("heading", { level: 1 }).click();
  const comment = `Virsrakstu lielāku ${Date.now()}`;
  await page.getByLabel("Kas jāmaina?").fill(comment);
  await page.getByRole("button", { name: "Saglabāt" }).click();
  await expect(page.getByRole("button", { name: /^Piezīme \d+$/ }).first()).toBeVisible();

  await page.goto("/labojumi");
  await expect(page.getByText(comment)).toBeVisible();
  const card = page.locator("li", { hasText: comment });
  await card.getByRole("button", { name: "Atzīmēt kā izdarītu" }).click();
  await expect(page.getByText(comment)).toHaveCount(0);
  await page.goto("/labojumi?status=done");
  await expect(page.getByText(comment)).toBeVisible();
});
