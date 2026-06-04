# Runbook de deploy — Agendalo (Vercel)

App Next.js 16 + Prisma 7 + Supabase + Clerk + Mercado Pago + Resend + Twilio.
Para una app Next.js sola, **Vercel alcanza** (incluye serverless + crons). Render
solo si se suma un worker/proceso aparte.

> Objetivo del deploy: tener un dominio HTTPS real para que el **webhook de
> Mercado Pago** llegue y los turnos se confirmen solos (lo que en `localhost`
> no funciona).

---

## 0. Antes de empezar (local)
- [ ] `npm run build` pasa limpio en local (si falla, lo arreglamos antes de subir).
- [ ] Commit + push de la rama a GitHub (Vercel deploya desde el repo).
- [ ] Tener a mano el `.env.local` con todas las claves.

## 1. Base de datos (Supabase) — connection pooler
- [ ] En Supabase → Project Settings → Database → **Connection string → "Transaction pooler"** (puerto **6543**).
- [ ] Esa será la `DATABASE_URL` de producción (serverless necesita el pooler, no la conexión directa 5432).
- [ ] Si Prisma usa `directUrl` para migraciones, guardar también la directa (5432) como `DIRECT_URL`.
- [ ] Confirmar que las migraciones ya están aplicadas en la DB de prod.

## 2. Crear proyecto en Vercel
- [ ] Importar el repo de GitHub en Vercel.
- [ ] Framework: Next.js (autodetectado). Build: `next build` (default).
- [ ] NO deployar todavía: primero cargar las env vars (paso 3).

## 3. Variables de entorno en Vercel
Copiar TODAS las de `.env.local`. Checklist por grupo:

**App**
- [ ] `NEXT_PUBLIC_APP_URL` → **el dominio de prod** (ej. `https://agendalo.vercel.app`). ← clave para el webhook.

**Base de datos**
- [ ] `DATABASE_URL` → string del **pooler** (6543).
- [ ] `DIRECT_URL` → directa (5432), si se usa.

**Mercado Pago**
- [ ] `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `MP_ACCESS_TOKEN`
- [ ] `MP_WEBHOOK_SECRET`, `MP_SUSCRIPCION_PRO_PLAN_ID`

**Clerk**
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- [ ] (y las `*_SIGN_IN_URL` / `*_SIGN_UP_URL` si están en `.env.local`)

**Supabase Storage** (foto de perfil)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (las que use `src/lib/storage`).

**Resend (emails)**
- [ ] `RESEND_API_KEY`

**Twilio (WhatsApp)**
- [ ] `TWILIO_*` (account sid, auth token, número from).

**Cron**
- [ ] `CRON_SECRET` → el cron `/api/cron/reminders` exige `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron lo manda automáticamente si la var existe.

## 4. Primer deploy
- [ ] Lanzar el deploy. Si falla el build, leer el log (suele ser env var faltante o `DATABASE_URL`).
- [ ] Abrir la URL de prod y verificar que carga la home y `/p/<slug>`.

## 5. Configurar el webhook de Mercado Pago
- [ ] Panel de MP → tu aplicación → **Webhooks/Notificaciones**.
- [ ] URL: `https://<tu-dominio>/api/webhooks/mercadopago`
- [ ] Evento: **Pagos** (`payment`) y **Suscripciones** (`subscription_preapproval`).
- [ ] El `MP_WEBHOOK_SECRET` del panel debe coincidir con el de Vercel.

## 6. Configurar Clerk para el dominio prod
- [ ] Clerk Dashboard → agregar el dominio de prod a **allowed origins / redirect URLs**.
- [ ] Si pasás a instancia de producción de Clerk, actualizar las keys en Vercel.

## 7. Verificación end-to-end (la prueba real)
- [ ] Entrar a `/p/<slug>`, reservar un servicio con pago por Mercado Pago.
- [ ] Pagar con cuenta **tester**.
- [ ] Esperar unos segundos → la página de confirmación debe saltar sola a
      **"¡Reserva confirmada!"** (poller) y el turno aparecer **Confirmado** en el dashboard.
- [ ] Revisar en Vercel → Logs que el webhook entró con 200.
- [ ] (Opcional) Forzar el cron: `GET /api/cron/reminders` con el header Bearer, o esperar al schedule.

## 8. Pasaje a producción real (cuando quieras cobrar de verdad)
- [ ] Cambiar credenciales MP de **test → producción** en Vercel.
- [ ] Reconfigurar el webhook con la app de producción de MP.
- [ ] Probar un pago real chico antes de anunciar.

---

### Notas
- El `vercel.json` ya define el cron (`*/15 * * * *` → `/api/cron/reminders`). No hay que tocarlo.
- `back_urls` y `auto_return` se activan solos al tener `NEXT_PUBLIC_APP_URL` en HTTPS.
- Si algo del webhook no entra: revisar Logs de Vercel y que el `data.id`/firma coincidan.
