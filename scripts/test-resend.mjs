// Smoke test: manda un email real con Resend usando RESEND_API_KEY y RESEND_FROM_EMAIL del .env.local.
// Uso:  node scripts/test-resend.mjs tu-mail@gmail.com
//
// Si el dominio no está verificado vas a ver:
//   "The agendalo.app domain is not verified."
// Si está verificado vas a ver:
//   { id: '...' }  y te llega el mail.

import "dotenv/config";
import { Resend } from "resend";

const to = process.argv[2];
if (!to) {
  console.error("Uso: node scripts/test-resend.mjs <destinatario>");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL;

if (!apiKey) {
  console.error("Falta RESEND_API_KEY en .env.local");
  process.exit(1);
}
if (!from) {
  console.error("Falta RESEND_FROM_EMAIL en .env.local");
  process.exit(1);
}

console.log(`From: ${from}`);
console.log(`To:   ${to}`);

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from,
  to,
  subject: "Agendalo · smoke test",
  html: "<p>Si ves este mail, el dominio <b>agendalo.app</b> está verificado en Resend.</p>",
  text: "Si ves este mail, el dominio agendalo.app está verificado en Resend.",
});

if (error) {
  console.error("ERROR:", error);
  process.exit(1);
}

console.log("OK:", data);
