/**
 * Vai meklētājprogrammas drīkst indeksēt vietni.
 * Līdz oficiālajai palaišanai — nē. Ieslēgt: Vercel mainīgais SITE_INDEXING=1.
 */
export const indexingAllowed = () => process.env.SITE_INDEXING === "1";
