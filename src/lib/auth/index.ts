import "server-only";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { isStrongPassword, WEAK_PASSWORD_MESSAGE } from "./password-rules";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/db";
import { sendEmail } from "@/lib/email/send";
import { afterGoogleLinked, afterSessionCreated, markEmailVerified } from "./devices";

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
    maxPasswordLength: 128,
    autoSignIn: true,
    // paroles iestatīšana pēc saites e-pastā apliecina, ka e-pasts pieder lietotājam
    onPasswordReset: async ({ user }) => {
      await markEmailVerified(user.id);
    },
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
  // Stipra parole visur, kur to iestata (reģistrācija, atjaunošana, maiņa)
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const pw =
        ctx.path === "/sign-up/email" ? ctx.body?.password : ctx.path === "/reset-password" || ctx.path === "/change-password" ? ctx.body?.newPassword : undefined;
      if (typeof pw === "string" && !isStrongPassword(pw)) {
        throw new APIError("BAD_REQUEST", { message: WEAK_PASSWORD_MESSAGE, code: "WEAK_PASSWORD" });
      }
      if (ctx.path === "/sign-up/email" && typeof ctx.body?.name === "string" && ctx.body.name.trim().length < 2) {
        throw new APIError("BAD_REQUEST", { message: "Norādi vārdu un uzvārdu.", code: "NAME_REQUIRED" });
      }
    }),
  },
  // Google pieslēgšanās piesaistās esošam kontam ar to pašu e-pastu (Google e-pastu ir pārbaudījis)
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"], requireLocalEmailVerified: false },
  },
  // Vienlaikus ne vairāk kā MAX_DEVICES ierīces; pieslēgšanās vēsture koplietošanas pazīmēm
  databaseHooks: {
    account: {
      create: {
        after: async (acc) => {
          if (acc.providerId === "google") await afterGoogleLinked(acc.userId);
        },
      },
    },
    session: {
      create: {
        after: async (s) => {
          await afterSessionCreated(s);
        },
      },
    },
  },
  plugins: [
    nextCookies(), // jābūt pēdējam
  ],
});

export const isGoogleEnabled = googleEnabled;
