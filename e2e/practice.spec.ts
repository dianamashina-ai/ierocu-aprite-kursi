import { expect, test } from "@playwright/test";
import { paidUser } from "./helpers";

test("ceļš: sākums → modulis → tēma → treniņš", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ieroču atļaujai");
  await expect(page.getByRole("link", { name: /Sākt bez maksas/ }).first()).toBeVisible();
  await page.locator("#programma summary", { hasText: "Ierocis: uzbūve un darbība" }).click();
  await expect(page.locator("#programma").getByText("Pamatjēdzieni un darbības princips")).toBeVisible();
  await page.getByRole("link", { name: /Atvērt moduli/ }).first().click();
  await expect(page).toHaveURL(/\/modulis\/M1$/);
  await page.getByRole("link", { name: /Pamatjēdzieni un darbības princips/ }).click();
  await expect(page).toHaveURL(/\/tema\/1-1$/);
  await page.getByRole("link", { name: /Trenēties \(15\)/ }).click();
  await expect(page.getByText("Jautājums 1 no 15")).toBeVisible();
});

test("treniņš: atbilde → atgriezeniskā saite → nākamais → rezultāts", async ({ page }) => {
  await paidUser(page, "p91");
  await page.goto("/tema/2-2/trenins"); // 8 jautājumi
  for (let i = 0; i < 8; i++) {
    const options = page.locator("fieldset button");
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2);
    expect(count).toBeLessThanOrEqual(6);
    await options.first().click();
    await expect(page.getByText(/^(Pareizi|Nepareizi\. Pareizā atbilde: [A-F])$/)).toBeVisible();
    await expect(options.first()).toBeDisabled();
    await page.getByRole("button", { name: i < 7 ? "Nākamais jautājums" : "Skatīt rezultātu" }).click();
  }
  await expect(page.getByRole("heading", { name: "Treniņš pabeigts" })).toBeVisible();
  await expect(page.getByText(/Pareizi \d+ no 8/)).toBeVisible();
});

test("pareizās atbildes izcelšana sakrīt ar datiem (Q243 — labots jautājums)", async ({ page }) => {
  await paidUser(page, "p622");
  await page.goto("/jautajums/243");
  const correct = page.locator("fieldset button", { hasText: "visas atbildes ir pareizas" });
  await correct.click();
  await expect(page.getByText("Pareizi", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mēģināt vēlreiz" }).click();
  await expect(page.locator("fieldset button").first()).toBeEnabled();
});

test("Q468 rāda 4 variantus", async ({ page }) => {
  await paidUser(page, "p104");
  await page.goto("/jautajums/468");
  await expect(page.locator("fieldset button")).toHaveCount(4);
});

test("tastatūra: burts izvēlas atbildi", async ({ page, isMobile }) => {
  await paidUser(page, "p201");
  test.skip(isMobile, "tikai datoram");
  await page.goto("/jautajums/1");
  await page.waitForLoadState("networkidle"); // jāsagaida hidratācija, citādi taustiņš vēl netiek apstrādāts
  await page.keyboard.press("b");
  await expect(page.getByText(/^(Pareizi|Nepareizi\. Pareizā atbilde: [A-F])$/)).toBeVisible();
});

test("salīdzināt līdzīgos: no jautājuma uz saimi", async ({ page }) => {
  await paidUser(page, "p595");
  await page.goto("/jautajums/58");
  await page.locator("fieldset button").first().click();
  await page.getByRole("link", { name: /Salīdzināt līdzīgos \(4\)/ }).click();
  await expect(page).toHaveURL(/\/saime\/54\?no=58/);
  await expect(page.getByRole("heading", { name: "Līdzīgie jautājumi", level: 1 })).toBeVisible();
  await expect(page.getByText("Formulējums nedaudz atšķiras")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(4);
});

test("meklēšana pēc numura un teksta", async ({ page }) => {
  await page.goto("/meklet");
  await page.getByRole("searchbox").fill("243");
  await page.getByRole("button", { name: "Meklēt" }).click();
  await expect(page.getByText("Atrasts 1 jautājums")).toBeVisible();
  await page.getByRole("searchbox").fill("nēsāšanas atļauju izsniedz");
  await page.getByRole("button", { name: "Meklēt" }).click();
  await expect(page.getByText("Atrasti 4 jautājumi")).toBeVisible();
});

test("neeksistējoša lapa — latviski", async ({ page }) => {
  await page.goto("/jautajums/999");
  await expect(page.getByRole("heading", { name: "Lapa nav atrasta" })).toBeVisible();
});
