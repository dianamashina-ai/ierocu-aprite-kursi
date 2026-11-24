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

test("administrācija: manuāla piekļuve jaunam lietotājam un uzaicinājums", async ({ browser, request }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail("skaidra");
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await signInAdmin(admin);
  await admin.goto("/admin/lietotaji");
  await admin.getByRole("button", { name: "Pievienot lietotāju" }).click();
  await admin.getByLabel("E-pasts").fill(email);
  await admin.getByLabel(/Vārds, uzvārds/).fill("Skaidras Naudas Klients");
  await admin.getByLabel("Samaksāts skaidrā naudā").check();
  await admin.getByRole("button", { name: "Piešķirt piekļuvi" }).click();
  await expect(admin.getByRole("status")).toContainText("Konts izveidots");
  await admin.getByRole("link", { name: "Atvērt lietotāju" }).click();
  await expect(admin.getByRole("heading", { name: email })).toBeVisible();
  await expect(admin.getByText("Piešķirts")).toBeVisible();
  await adminCtx.close();

  // uzaicinājums: saite paroles iestatīšanai → uzreiz pieslēgts ar pilnu piekļuvi
  const outbox = await (await request.get("/api/dev/outbox")).json();
  const mail = outbox.find((m: { to: string; subject: string }) => m.to === email && /pilna piekļuve/.test(m.subject));
  const link = mail.text.match(/https?:\/\/\S+parole\/jauna\S*/)[0];
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Iestati paroli" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await page.getByLabel(/Jaunā parole/).fill("Klienta-Parole-1!");
  await page.getByRole("button", { name: "Saglabāt un sākt mācīties" }).click();
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
  await page.goto("/konts");
  await expect(page.locator("#saturs").getByText("Pilna piekļuve", { exact: true })).toBeVisible();
  await ctx.close();
});

test("administrācija: administratora e-pasts bez apstiprinājuma nedod tiesības", async ({ page }) => {
  // adrese ir ADMIN_EMAILS (playwright.config.ts), bet konts reģistrēts ar paroli — e-pasts nav apstiprināts
  const email = "neapst-admins-e2e@example.com";
  await page.goto("/registreties");
  await page.getByLabel("Vārds un uzvārds").fill("Neapstiprināts Admins");
  await page.getByLabel("E-pasts").fill(email);
  await page.getByLabel(/Parole/).fill("Drosa-Parole-123!");
  await page.getByRole("button", { name: "Izveidot kontu" }).click();
  if (!(await page.waitForURL(/^https?:\/\/[^/]+\/$/, { timeout: 4000 }).then(() => true, () => false))) {
    await page.goto("/pieslegties");
    await page.getByLabel("E-pasts").fill(email);
    await page.getByLabel("Parole").fill("Drosa-Parole-123!");
    await page.getByRole("button", { name: "Pieslēgties" }).click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
  }
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});
