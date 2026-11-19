import { expect, test, type Page } from "@playwright/test";

const uniqueEmail = (tag: string) => `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

async function signUp(page: Page, email: string) {
  await page.goto("/registreties");
  await page.getByLabel("E-pasts").fill(email);
  await page.getByLabel(/Parole/).fill("drosa-parole-123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Izveidot kontu" }).click();
  await expect(page).toHaveURL(/\/panelis$/);
}

test("reģistrācija → panelis → iziet → pieslēgties ar paroli", async ({ page }) => {
  const email = uniqueEmail("pw");
  await signUp(page, email);
  await expect(page.getByRole("heading", { name: /Sveiks/ })).toBeVisible();
  await expect(page.getByText("vēl nav atbildēti")).toBeVisible();
  await page.getByRole("button", { name: "Iziet" }).click();
  await expect(page.getByRole("link", { name: "Pieslēgties" })).toBeVisible();

  await page.goto("/panelis");
  await expect(page).toHaveURL(/\/pieslegties\?next=%2Fpanelis/);
  await page.getByLabel("E-pasts").fill(email);
  await page.getByLabel("Parole").fill("nepareiza-parole");
  await page.getByRole("button", { name: "Pieslēgties" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("Nepareizs e-pasts vai parole.");
  await page.getByLabel("Parole").fill("drosa-parole-123");
  await page.getByRole("button", { name: "Pieslēgties" }).click();
  await expect(page).toHaveURL(/\/panelis$/);
});

test("pieslēgšanās ar saiti e-pastā", async ({ page, request }) => {
  const email = uniqueEmail("ml");
  await signUp(page, email);
  await page.getByRole("button", { name: "Iziet" }).click();
  await page.goto("/pieslegties");
  await page.getByRole("tab", { name: "Saite e-pastā" }).click();
  await page.getByLabel("E-pasts").fill(email);
  await page.getByRole("button", { name: "Sūtīt saiti" }).click();
  await expect(page.getByRole("status")).toContainText("Saite nosūtīta");
  const outbox = await (await request.get("/api/dev/outbox")).json();
  const mail = outbox.find((m: { to: string }) => m.to === email);
  const link = mail.text.match(/https?:\/\/\S+/)[0];
  await page.goto(link);
  await expect(page).toHaveURL(/\/panelis$/);
});

test("atbildes saglabājas; kļūda nonāk kļūdu sarakstā; panelis rāda progresu", async ({ page }) => {
  await signUp(page, uniqueEmail("progress"));
  await page.goto("/jautajums/1");
  // izvēlamies nepareizu: atrodam pareizo pēc atbildes un, ja trāpījām, mēģinām citu jautājumu
  await page.locator("fieldset button", { hasNotText: "variants" }).first().click();
  const wasCorrect = await page.getByText("Pareizi", { exact: true }).isVisible();
  await page.waitForTimeout(500); // servera darbība
  await page.goto("/panelis");
  await expect(page.getByText("vēl nav atbildēti").locator("..")).toContainText("514");
  await page.goto("/kludas?visas=1");
  if (wasCorrect) await expect(page.getByText("Kļūdu nav.")).toBeVisible();
  else await expect(page.locator("fieldset button").first()).toBeVisible();
});

test("izmēģinājuma eksāmens: sākt, atbildēt, turpināt pēc pārlādes, pabeigt, rezultāts", async ({ page }) => {
  test.setTimeout(90_000);
  await signUp(page, uniqueEmail("exam"));
  await page.goto("/eksamens");
  await page.getByRole("button", { name: "Sākt eksāmenu" }).click();
  await expect(page).toHaveURL(/\/eksamens\/[0-9a-f-]+$/);
  await expect(page.getByRole("timer")).toHaveText(/^(40:00|39:\d\d)$/);
  await expect(page.locator("nav[aria-label='Jautājumi'] button")).toHaveCount(40);

  // atbild uz pirmajiem 3, pārlādē, pārbauda, ka saglabāts
  for (let i = 0; i < 3; i++) {
    await page.locator("fieldset button").first().click();
    await page.getByRole("button", { name: "Nākamais →" }).click();
  }
  await page.waitForTimeout(700);
  await page.reload();
  await expect(page.getByText("Atbildēti 3 no 40")).toBeVisible();
  // eksāmena laikā nav skaidrojumu un pareizo atbilžu
  await expect(page.getByText("Skaidrojums")).toHaveCount(0);

  await page.getByRole("button", { name: "Pabeigt eksāmenu" }).last().click();
  await expect(page.getByText(/Neatbildēti 37 jautājumi/)).toBeVisible();
  await page.getByRole("button", { name: "Jā, pabeigt" }).click();
  await expect(page.getByRole("heading", { name: "Eksāmens nav nokārtots" })).toBeVisible();
  await expect(page.getByText("Nav atbildēts").first()).toBeVisible();
  await page.getByRole("link", { name: "Rādīt tikai kļūdas" }).click();
  await expect(page.locator("ol > li")).toHaveCount(await page.locator("ol > li").count());

  await page.goto("/panelis");
  await expect(page.getByText("Nav nokārtots").first()).toBeVisible();
});

test("viesis var trenēties, bet panelis prasa pieslēgšanos", async ({ page }) => {
  await page.goto("/tema/1-1/trenins");
  await page.locator("fieldset button").first().click();
  await expect(page.getByText(/^(Pareizi|Nepareizi\. Pareizā atbilde: [a-f])$/)).toBeVisible();
  await page.goto("/kludas");
  await expect(page).toHaveURL(/\/pieslegties/);
});
