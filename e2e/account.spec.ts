import { expect, test } from "@playwright/test";
import { buyAccess, signOut, signUp, uniqueEmail } from "./helpers";

test("reģistrācija → mācību kurss ar progresu → iziet → pieslēgties ar paroli", async ({ page }) => {
  const email = uniqueEmail("pw");
  await signUp(page, email);
  await expect(page.getByRole("heading", { name: /^Sveiki/, level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ceļš līdz eksāmenam" })).toBeVisible();
  await expect(page.getByText(/pareizi atbildēti 0 no 515/)).toBeVisible();
  await signOut(page);

  await page.goto("/konts");
  await expect(page).toHaveURL(/\/pieslegties\?next=%2Fkonts/);
  await page.getByLabel("E-pasts").fill(email);
  await page.getByLabel("Parole").fill("nepareiza-parole");
  await page.getByRole("button", { name: "Pieslēgties" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("Nepareizs e-pasts vai parole.");
  await page.getByLabel("Parole").fill("Drosa-Parole-123!");
  await page.getByRole("button", { name: "Pieslēgties" }).click();
  await expect(page).toHaveURL(/\/konts$/);
});

test("aizmirsta parole: saite e-pastā → jauna parole → pieslēgšanās", async ({ page, request }) => {
  const email = uniqueEmail("reset");
  await signUp(page, email);
  await signOut(page);
  await page.goto("/pieslegties");
  await expect(page.getByRole("tab")).toHaveCount(0); // vairs nav pārslēgšanas “Saite e-pastā”
  await page.getByRole("link", { name: "Aizmirsi paroli?" }).click();
  await expect(page.getByRole("heading", { name: "Aizmirsi paroli?" })).toBeVisible();
  await page.getByLabel("E-pasts").fill(email);
  await page.getByRole("button", { name: "Sūtīt saiti" }).click();
  await expect(page.getByRole("status")).toContainText("nosūtījām saiti");
  const outbox = await (await request.get("/api/dev/outbox")).json();
  const mail = outbox.find((m: { to: string; subject: string }) => m.to === email && /Paroles/.test(m.subject));
  await page.goto(mail.text.match(/https?:\/\/\S+/)[0]);
  await expect(page).toHaveURL(/\/parole\/jauna\?token=/);
  await page.getByLabel(/Jaunā parole/).fill("Jauna-Parole-789!");
  await page.getByRole("button", { name: "Saglabāt paroli" }).click();
  await expect(page).toHaveURL(/\/pieslegties\?parole=mainita/);
  await page.getByLabel("E-pasts").fill(email);
  await page.getByLabel("Parole", { exact: true }).fill("Jauna-Parole-789!");
  await page.getByRole("button", { name: "Pieslēgties" }).click();
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
  await expect(page.getByText(wasCorrect ? /pareizi atbildēti 1 no 515/ : /pareizi atbildēti 0 no 515/)).toBeVisible();
  // kļūda redzama treniņa izvēlē pie tēmas
  await page.goto("/trenins");
  if (wasCorrect) await expect(page.getByText("Kļūdu pagaidām nav.")).toBeVisible();
  else await expect(page.getByText(/^1 jautājums · biežāk kļūdainie vispirms$/)).toBeVisible();
});

test("trenēties: izvēlas moduli un skaitu → treniņš ar izvēlēto jautājumu skaitu", async ({ page }) => {
  await signUp(page, uniqueEmail("trenins"));
  await buyAccess(page);
  await page.goto("/trenins");
  await expect(page.getByRole("heading", { name: "Trenēties", level: 1 })).toBeVisible();
  // pēc noklusējuma — visi moduļi
  await expect(page.getByRole("button", { name: /Visi moduļi/ })).toBeVisible();
  await page.getByRole("button", { name: /Visi moduļi/ }).click();
  await page.getByRole("button", { name: "Visi moduļi", exact: true }).click(); // notīra
  await expect(page.getByRole("button", { name: /^Sākt treniņu/ })).toBeDisabled();
  await page.getByRole("option", { name: /01 Ierocis/ }).getByRole("button").click();
  await page.keyboard.press("Escape");
  await page.getByRole("radio", { name: "10" }).check({ force: true });
  await page.getByRole("button", { name: "Sākt treniņu · 10 jaut." }).click();
  await expect(page).toHaveURL(/\/trenins\/sakt\?moduli=M1&skaits=10/);
  await expect(page.getByText("Jautājums 1 no 10")).toBeVisible();
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
    await page.getByRole("button", { name: /^Nākamais/ }).click();
  }
  await page.waitForTimeout(700);
  await page.reload();
  // atbildes saglabātas: pēc pārlādes turpinām no 4. jautājuma
  await expect(page.getByText("Jautājums 4 no 40")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Nākamais/ })).toBeDisabled();
  // eksāmena laikā nav skaidrojumu un pareizo atbilžu
  await expect(page.getByText("Skaidrojums")).toHaveCount(0);

  // izejot no eksāmena — sākumlapā “Turpināt eksāmenu” ar atlikušo laiku
  const examUrl = page.url();
  await page.goto("/eksamens");
  await expect(page.getByText("Atbildēti 3 no 40")).toBeVisible();
  await expect(page.getByRole("timer")).toHaveText(/^(40:00|39:\d\d)$/);
  await page.getByRole("link", { name: "Turpināt eksāmenu" }).click();
  await expect(page).toHaveURL(examUrl);
  await expect(page.getByText("Jautājums 4 no 40")).toBeVisible();

  // pirms pēdējā jautājuma pabeigt nevar — nav pogas “Pabeigt eksāmenu”
  await expect(page.getByRole("button", { name: "Pabeigt eksāmenu" })).toHaveCount(0);
  for (let i = 3; i < 40; i++) {
    await page.locator("fieldset button").first().click();
    if (i < 39) await page.getByRole("button", { name: /^Nākamais/ }).click();
  }
  await expect(page.getByText("Jautājums 40 no 40")).toBeVisible();
  await page.getByRole("button", { name: "Pabeigt eksāmenu" }).click();
  await expect(page.getByText("Visi jautājumi atbildēti.")).toBeVisible();
  await page.getByRole("button", { name: "Jā, pabeigt" }).click();
  await expect(page.getByRole("heading", { name: /^Eksāmens (nav )?nokārtots$/ })).toBeVisible();

  await page.goto("/eksamens");
  await expect(page.getByRole("button", { name: "Sākt eksāmenu" })).toBeVisible();
  await expect(page.getByText(/^(Nokārtots|Nav nokārtots)$/).first()).toBeVisible();
});

test("viesis var trenēties, bet kļūdu saraksts prasa pieslēgšanos", async ({ page }) => {
  await page.goto("/tema/1-1/trenins");
  await page.locator("fieldset button").first().click();
  await expect(page.getByText(/^(Pareizi|Nepareizi\. Pareizā atbilde: [A-F])$/).first()).toBeVisible();
  await page.goto("/trenins");
  await expect(page).toHaveURL(/\/pieslegties/);
});

test("mans konts: vārds, parole, e-pasta maiņa ar apstiprinājumu", async ({ page, request }) => {
  const email = uniqueEmail("konts");
  await signUp(page, email);
  await page.goto("/konts");
  await expect(page.getByRole("heading", { name: "Profils" })).toBeVisible();

  await page.getByLabel("Vārds un uzvārds").fill("Anna");
  await page.getByRole("button", { name: "Saglabāt" }).click();
  await expect(page.getByText("Saglabāts.")).toBeVisible();

  await page.getByLabel("Pašreizējā parole").fill("nepareiza-parole");
  await page.getByLabel("Jaunā parole", { exact: true }).fill("Jauna-Parole-456!");
  await page.getByLabel("Jaunā parole vēlreiz").fill("Jauna-Parole-456!");
  await page.getByRole("button", { name: "Mainīt paroli" }).click();
  await expect(page.getByText("Pašreizējā parole nav pareiza.")).toBeVisible();
  await page.getByLabel("Pašreizējā parole").fill("Drosa-Parole-123!");
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
  await page.getByLabel("Parole").fill("Jauna-Parole-456!");
  await page.getByRole("button", { name: "Pieslēgties" }).click();
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
});
