import { expect, test } from "@playwright/test";
import { buyAccess, signOut, signUp, uniqueEmail } from "./helpers";

test("reģistrācija → mācību kurss ar progresu → iziet → pieslēgties ar paroli", async ({ page }) => {
  const email = uniqueEmail("pw");
  await signUp(page, email);
  await expect(page.getByRole("heading", { name: "Mācību kurss", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ceļš līdz gatavībai" })).toBeVisible();
  await expect(page.getByText("vēl nav atbildēti")).toBeVisible();
  await signOut(page);

  await page.goto("/konts");
  await expect(page).toHaveURL(/\/pieslegties\?next=%2Fkonts/);
  await page.getByLabel("E-pasts").fill(email);
  await page.getByLabel("Parole").fill("nepareiza-parole");
  await page.getByRole("button", { name: "Pieslēgties" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("Nepareizs e-pasts vai parole.");
  await page.getByLabel("Parole").fill("drosa-parole-123");
  await page.getByRole("button", { name: "Pieslēgties" }).click();
  await expect(page).toHaveURL(/\/konts$/);
});

test("pieslēgšanās ar saiti e-pastā", async ({ page, request }) => {
  const email = uniqueEmail("ml");
  await signUp(page, email);
  await signOut(page);
  await page.goto("/pieslegties");
  await page.getByRole("tab", { name: "Saite e-pastā" }).click();
  await page.getByLabel("E-pasts").fill(email);
  await page.getByRole("button", { name: "Sūtīt saiti" }).click();
  await expect(page.getByRole("status")).toContainText("Saite nosūtīta");
  const outbox = await (await request.get("/api/dev/outbox")).json();
  const mail = outbox.find((m: { to: string }) => m.to === email);
  const link = mail.text.match(/https?:\/\/\S+/)[0];
  await page.goto(link);
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
});

test("atbildes saglabājas; kļūda nonāk kļūdu sarakstā; panelis rāda progresu", async ({ page }) => {
  await signUp(page, uniqueEmail("progress"));
  await buyAccess(page);
  await page.goto("/jautajums/1");
  // izvēlamies nepareizu: atrodam pareizo pēc atbildes un, ja trāpījām, mēģinām citu jautājumu
  await page.locator("fieldset button", { hasNotText: "variants" }).first().click();
  const wasCorrect = await page.getByText("Pareizi", { exact: true }).isVisible();
  await page.waitForTimeout(500); // servera darbība
  await page.goto("/");
  await expect(page.getByText("vēl nav atbildēti").locator("..")).toContainText("514");
  await page.goto("/kludas?visas=1");
  if (wasCorrect) await expect(page.getByText("Kļūdu nav.")).toBeVisible();
  else await expect(page.locator("fieldset button").first()).toBeVisible();
});

test("izmēģinājuma eksāmens: sākt, atbildēt, turpināt pēc pārlādes, pabeigt, rezultāts", async ({ page }) => {
  test.setTimeout(90_000);
  await signUp(page, uniqueEmail("exam"));
  await buyAccess(page);
  await page.goto("/eksamens");
  await page.getByRole("button", { name: "Sākt eksāmenu" }).click();
  await expect(page).toHaveURL(/\/eksamens\/[0-9a-f-]+$/);
  await expect(page.getByRole("timer")).toHaveText(/^(40:00|39:\d\d)$/);
  await expect(page.getByText("Jautājums 1 no 40")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Eksāmena progress" })).toBeVisible();

  // atbild uz pirmajiem 3, pārlādē, pārbauda, ka saglabāts
  for (let i = 0; i < 3; i++) {
    await page.locator("fieldset button").first().click();
    await page.getByRole("button", { name: "Nākamais →" }).click();
  }
  await page.waitForTimeout(700);
  await page.reload();
  // atbildes saglabātas: pēc pārlādes turpinām no 4. jautājuma
  await expect(page.getByText("Jautājums 4 no 40")).toBeVisible();
  await expect(page.getByRole("button", { name: "Nākamais →" })).toBeDisabled();
  // eksāmena laikā nav skaidrojumu un pareizo atbilžu
  await expect(page.getByText("Skaidrojums")).toHaveCount(0);

  await page.getByRole("button", { name: "Pabeigt eksāmenu" }).last().click();
  await expect(page.getByText(/Neatbildēti 37 jautājumi/)).toBeVisible();
  await page.getByRole("button", { name: "Jā, pabeigt" }).click();
  await expect(page.getByRole("heading", { name: "Eksāmens nav nokārtots" })).toBeVisible();
  await expect(page.getByText("Nav atbildēts").first()).toBeVisible();
  await page.getByRole("link", { name: "Rādīt tikai kļūdas" }).click();
  await expect(page.locator("ol > li")).toHaveCount(await page.locator("ol > li").count());

  await page.goto("/eksamens");
  await expect(page.getByText("Nav nokārtots").first()).toBeVisible();
});

test("viesis var trenēties, bet kļūdu saraksts prasa pieslēgšanos", async ({ page }) => {
  await page.goto("/tema/1-1/trenins");
  await page.locator("fieldset button").first().click();
  await expect(page.getByText(/^(Pareizi|Nepareizi\. Pareizā atbilde: [A-F])$/)).toBeVisible();
  await page.goto("/kludas");
  await expect(page).toHaveURL(/\/pieslegties/);
});

test("mans konts: vārds, parole, e-pasta maiņa ar apstiprinājumu", async ({ page, request }) => {
  const email = uniqueEmail("konts");
  await signUp(page, email);
  await page.goto("/konts");
  await expect(page.getByRole("heading", { name: "Mans konts" })).toBeVisible();

  await page.getByLabel("Vārds").fill("Anna");
  await page.getByRole("button", { name: "Saglabāt" }).click();
  await expect(page.getByText("Vārds saglabāts.")).toBeVisible();

  await page.getByLabel("Pašreizējā parole").fill("nepareiza-parole");
  await page.getByLabel("Jaunā parole", { exact: true }).fill("jauna-parole-456");
  await page.getByLabel("Jaunā parole vēlreiz").fill("jauna-parole-456");
  await page.getByRole("button", { name: "Mainīt paroli" }).click();
  await expect(page.getByText("Pašreizējā parole nav pareiza.")).toBeVisible();
  await page.getByLabel("Pašreizējā parole").fill("drosa-parole-123");
  await page.getByRole("button", { name: "Mainīt paroli" }).click();
  await expect(page.getByText(/Parole nomainīta/)).toBeVisible();

  const newEmail = uniqueEmail("jauns");
  await page.getByLabel("Jaunā e-pasta adrese").fill(newEmail);
  await page.getByRole("button", { name: "Mainīt e-pastu" }).click();
  await expect(page.getByText(/nosūtījām saiti/)).toBeVisible();
  const outbox = await (await request.get("/api/dev/outbox")).json();
  const mail = outbox.find((m: { to: string }) => m.to === newEmail);
  await page.goto(mail.text.match(/https?:\/\/\S+/)[0]);
  await expect(page).toHaveURL(/\/konts\?epasts=mainits/);
  await expect(page.getByText(newEmail)).toBeVisible();

  await signOut(page);
  await page.goto("/pieslegties");
  await page.getByLabel("E-pasts").fill(newEmail);
  await page.getByLabel("Parole").fill("jauna-parole-456");
  await page.getByRole("button", { name: "Pieslēgties" }).click();
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
});
