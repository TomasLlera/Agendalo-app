import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas accesibles sin sesión. Todo lo demás exige autenticación.
// La página pública /p/[slug] y los webhooks/cron NO deben pasar por Clerk.
const isPublicRoute = createRouteMatcher([
  "/",
  "/precios",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/p/(.*)",
  "/api/webhooks/(.*)",
  "/api/profesional/(.*)",
  "/api/reservas",
  "/api/checkout/turno",
  "/api/cron/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Salta archivos estáticos e internos de Next, salvo que vengan en query params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre corre en rutas de API.
    "/(api|trpc)(.*)",
  ],
};
