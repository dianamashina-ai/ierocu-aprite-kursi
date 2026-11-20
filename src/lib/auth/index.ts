import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { db, schema } from "@/db";
import { sendEmail } from "@/lib/email/send";

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  appName: "Ieroču atļauja",
  // Servera puses adrese (nolasa palaišanas brīdī, ne būvējot)
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Paroles atjaunošana",
        text: `Lai iestatītu jaunu paroli, atver saiti (derīga 1 stundu):\n${url}\n\nJa paroli nemainīji, šo vēstuli vari ignorēt.`,
      });
    },
  },
  // E-pasta maiņa: jaunā adrese stājas spēkā tikai pēc saites atvēršanas jaunajā pastkastē.
  user: { changeEmail: { enabled: true } },
  emailVerification: {
    sendOnSignUp: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Apstiprini e-pasta adresi",
        text: `Lai apstiprinātu šo e-pasta adresi savam kontam, atver saiti:\n${url}\n\nJa e-pastu nemainīji, šo vēstuli vari ignorēt.`,
      });
    },
  },
  socialProviders: googleEnabled
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } }
    : {},
  // Aizsardzība pret paroļu minēšanu (pēc noklusējuma ieslēgta produkcijā).
  // Izslēdzama tikai automātiskajiem testiem: AUTH_RATE_LIMIT=off
  rateLimit: { enabled: process.env.AUTH_RATE_LIMIT !== "off" && process.env.NODE_ENV === "production" },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 dienas
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Pieslēgšanās saite",
          text: `Lai pieslēgtos, atver saiti (derīga 15 minūtes):\n${url}\n\nJa pieslēgšanos nepieprasīji, šo vēstuli vari ignorēt.`,
        });
      },
    }),
    nextCookies(), // jābūt pēdējam
  ],
});

export const isGoogleEnabled = googleEnabled;
