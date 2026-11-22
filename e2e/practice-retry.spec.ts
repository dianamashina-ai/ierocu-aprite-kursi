import { test, expect } from "@playwright/test";
import { paidUser } from "./helpers";
test("kļūdu atkārtojums paliek fokusa režīmā (arī ar vienu jautājumu)", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  test.setTimeout(60000);
  await paidUser(page, "rt");
  await page.goto("/tema/2-2/trenins");
  // atbild pareizi visiem, izņemot pirmo: pirmajam izvēlas variantu, tad pārbauda
  let first = true;
  for (;;) {
    const opts = page.locator("fieldset button");
    await opts.first().waitFor();
    if (first) { await opts.first().click(); first = false; }
    else {
      // izvēlas pareizo: noklikšķina, ja nepareizi — vienalga
      await opts.last().click();
    }
    const btn = page.locator("div.fixed.bottom-0 button");
    const label = await btn.textContent();
    await btn.click();
    if (label?.includes("rezultāt")) break;
  }
  await page.getByRole("button", { name: /Atkārtot kļūdas/ }).click();
  await expect(page.locator("header.site-header")).toBeHidden();
  await expect(page.locator("div.fixed.bottom-0 button")).toBeVisible();
});
