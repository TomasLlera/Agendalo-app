import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Check,
  CreditCard,
  HeartHandshake,
  Link2,
  MessageCircle,
  Minus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRECIO_PRO_ARS } from "@/lib/plan";
import { MotionReveal } from "./_components/motion-reveal";
import { DashboardMock } from "./_components/dashboard-mock";
import { AppCarousel } from "./_components/app-carousel";
import { ContactForm } from "./_components/contact-form";
import { ExtrasDial } from "./_components/extras-dial";
import { RoiCalculator } from "./_components/roi-calculator";
import { SocialProofPill } from "./_components/social-proof-pill";
import { HeroCanvas } from "./_components/hero-canvas";
import { Footer } from "@/components/shared/footer";

export const metadata: Metadata = {
  // `absolute` evita que el template del layout raíz ("%s · Agendalo") agregue
  // un segundo "Agendalo" al final del título.
  title: {
    absolute: "Agendalo — La forma más simple de gestionar tus turnos",
  },
  description:
    "SaaS de agenda para profesionales independientes. Reservas online, recordatorios por WhatsApp y cobros con Mercado Pago.",
};

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Link de WhatsApp para los CTA de soporte (formato wa.me, sin signos). */
const WHATSAPP_URL =
  "https://wa.me/542236353735?text=" +
  encodeURIComponent("Hola! Quiero saber más sobre Agendalo.");

/**
 * Landing snap-scroll. Cada `<Section>` ocupa una "página" (min-h-screen +
 * scroll-snap-align: start). El padding-top (`pt-24`) deja espacio para el
 * header floating del layout.
 */
export default function LandingPage() {
  return (
    <>
      <section
        id="hero"
        className="relative flex min-h-screen w-full snap-start items-center justify-center overflow-hidden px-6 pt-24 pb-12"
      >
        <HeroCanvas />
        <div className="w-full">
          <Hero />
        </div>
      </section>
      <Section id="dashboard">
        <DashboardSection />
      </Section>
      <Section id="features">
        <Features />
      </Section>
      <Section id="mas-funciones">
        <MasFunciones />
      </Section>
      <Section id="screens">
        <Screens />
      </Section>
      <Section id="ausencias">
        <Ausencias />
      </Section>
      <Section id="pricing">
        <Comparativa />
      </Section>
      <Section id="faq">
        <FAQ />
      </Section>
      <section
        id="contacto"
        className="flex min-h-screen w-full snap-start flex-col px-6 pt-24"
      >
        <div className="flex flex-1 items-center justify-center pb-8">
          <div className="w-full">
            <Contacto />
          </div>
        </div>
        <Footer />
      </section>
    </>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className="flex min-h-screen w-full snap-start items-center justify-center px-6 pt-24 pb-12"
    >
      <div className="w-full">{children}</div>
    </section>
  );
}

function Hero() {
  return (
    <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center text-center">
      <MotionReveal className="flex flex-col items-center">
        <div data-reveal>
          <Badge
            variant="outline"
            className="rounded-full border-border-strong/60 bg-surface/60 px-3 py-1 backdrop-blur-md"
          >
            <span className="relative mr-1.5 flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-success/70" />
              <span className="relative size-1.5 rounded-full bg-success" />
            </span>
            <span className="text-foreground/90">Pensado para emprendedores · Empezás gratis</span>
          </Badge>
        </div>
        <h1
          data-reveal
          className="mt-8 max-w-5xl text-5xl font-bold leading-[0.95] tracking-tighter sm:text-7xl md:text-[5.5rem]"
        >
          La forma más simple
          <br className="hidden sm:block" />
          <span className="text-gradient-brand"> para gestionar tus turnos</span>
        </h1>
        <p
          data-reveal
          className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          Una herramienta diseñada para ayudarte en el día a día: compartí tu
          link de reservas, organizá tu agenda y cobrá con Mercado Pago. Todo
          desde un solo lugar.
        </p>
        <div
          data-reveal
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/sign-up" />}
            className="bg-gradient-brand glow-violet relative border-0 px-6 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
          >
            Crear mi agenda gratis
          </Button>
          <Button
            variant="ghost"
            size="lg"
            nativeButton={false}
            render={<Link href="/precios" />}
            className="border border-border-strong/40 bg-surface/40 backdrop-blur hover:bg-surface/70"
          >
            Ver precios
          </Button>
        </div>
        <p data-reveal className="mt-4 text-xs text-subtle">
          Gratis para siempre. Activá WhatsApp y cobros online por{" "}
          <span className="text-foreground/80">
            {formatoARS.format(PRECIO_PRO_ARS)}/mes
          </span>{" "}
          cuando lo necesites.
        </p>
        <div data-reveal className="mt-10">
          <SocialProofPill />
        </div>
        <span
          data-reveal
          className="mt-12 inline-flex items-center gap-1.5 text-[11px] text-subtle"
        >
          <Sparkles className="size-3 text-secondary" strokeWidth={1.75} />
          Descubrí cómo funciona por dentro
        </span>
      </MotionReveal>
    </div>
  );
}

function DashboardSection() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          Tu panel
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Toda tu operación, en una sola pantalla
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Tus próximos turnos, los cobros del mes y la semana completa, siempre a un vistazo.
        </p>
      </header>
      <div className="mt-6">
        <DashboardMock />
      </div>
    </div>
  );
}

type Feature = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titulo: string;
  cuerpo: string;
  badge?: string;
};

const FEATURES: Feature[] = [
  {
    icon: Link2,
    titulo: "Tu link de reservas",
    cuerpo:
      "Compartís tu link y tus clientes reservan en segundos: sin descargar ninguna app, sin crear una cuenta.",
  },
  {
    icon: MessageCircle,
    titulo: "Recordatorios por WhatsApp",
    cuerpo:
      "Avisos automáticos 24 horas y 1 hora antes del turno. Reducís ausencias y dejás de perseguir a cada cliente.",
    badge: "Pro",
  },
  {
    icon: CreditCard,
    titulo: "Cobrá con Mercado Pago",
    cuerpo:
      "Pedí una seña al reservar o cobrá el total. El dinero entra directo a tu cuenta de Mercado Pago, sin intermediarios.",
    badge: "Pro",
  },
  {
    icon: BarChart3,
    titulo: "Estadísticas de tu negocio",
    cuerpo:
      "Seguí tus ingresos por mes y por servicio, descubrí tus días más flojos y compará tu evolución. Tu panel contable, sin planillas.",
    badge: "Pro",
  },
];

function Features() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          Features
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Lo que necesitás, sin lo que no
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Diseñado para profesionales independientes que quieren menos planillas y más tiempo para atender.
        </p>
      </header>
      <MotionReveal
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        immediate={false}
      >
        {FEATURES.map(({ icon: Icon, titulo, cuerpo, badge }) => (
          <article
            key={titulo}
            data-reveal
            className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 text-center backdrop-blur-md transition-all hover:border-border-strong hover:bg-surface/80"
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-linear-to-br from-secondary/0 via-secondary/0 to-secondary/0 opacity-0 transition-opacity duration-500 group-hover:from-secondary/10 group-hover:via-transparent group-hover:to-cyan-500/10 group-hover:opacity-100"
            />
            {badge ? (
              <Badge variant="secondary" className="absolute right-4 top-4">
                {badge}
              </Badge>
            ) : null}
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-surface-elevated ring-1 ring-secondary/20 transition-all group-hover:ring-secondary/40">
              <Icon className="size-4 text-secondary" strokeWidth={1.5} />
            </span>
            <h3 className="mt-4 text-base font-medium sm:min-h-12">{titulo}</h3>
            {/* Descripción: siempre visible en mobile; en desktop se revela
                al hover (grid-rows 0fr→1fr para una expansión suave). */}
            <div className="grid grid-rows-[1fr] opacity-100 transition-all duration-300 lg:grid-rows-[0fr] lg:opacity-0 lg:group-hover:grid-rows-[1fr] lg:group-hover:opacity-100">
              <p className="min-h-0 overflow-hidden pt-1 text-sm text-muted-foreground">
                {cuerpo}
              </p>
            </div>
          </article>
        ))}
      </MotionReveal>
    </div>
  );
}

function MasFunciones() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          Y mucho más
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Todo lo que necesita tu agenda
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Todos los detalles que hacen la diferencia en el día a día, sin
          configuraciones interminables.
        </p>
      </header>
      <div className="mt-10">
        <ExtrasDial />
      </div>
    </div>
  );
}

function Screens() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          Por dentro
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Una herramienta clara, sin curva de aprendizaje
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Recorré las pantallas principales y mirá cómo se ve Agendalo por dentro.
        </p>
      </header>
      <div className="mt-8">
        <AppCarousel />
      </div>
    </div>
  );
}

const AUSENCIAS_BULLETS = [
  "Avisos automáticos 24 horas y 1 hora antes de cada turno.",
  "Tus clientes confirman, reprograman o cancelan con un solo toque.",
  "Recuperás los huecos que liberan las cancelaciones a tiempo.",
] as const;

function Ausencias() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          Recordatorios
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Menos ausencias, más ingresos
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Los recordatorios automáticos hacen que tus clientes lleguen o avisen
          a tiempo. Menos huecos vacíos, más turnos que se traducen en plata.
        </p>
      </header>
      <MotionReveal
        className="mt-10 grid gap-4 lg:grid-cols-2 lg:items-stretch"
        immediate={false}
      >
        <div
          data-reveal
          className="flex flex-col justify-center rounded-2xl border border-border bg-surface/60 p-8 backdrop-blur-md"
        >
          <p className="text-6xl font-bold leading-none tracking-tighter text-gradient-brand sm:text-7xl">
            70%
          </p>
          <p className="mt-3 text-lg font-medium">
            menos ausencias con recordatorios automáticos
          </p>
          <ul className="mt-6 flex flex-col gap-3 text-sm">
            {AUSENCIAS_BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-success"
                  strokeWidth={1.5}
                />
                <span className="text-muted-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal>
          <RoiCalculator />
        </div>
      </MotionReveal>
    </div>
  );
}

const PLAN_ROWS = [
  { feature: "Página pública con tu link", free: true, pro: true },
  { feature: "Servicios y horarios ilimitados", free: true, pro: true },
  { feature: "Reservas online sin registro para el cliente", free: true, pro: true },
  { feature: "Recordatorios por WhatsApp (24 h + 1 h)", free: false, pro: true },
  { feature: "Cobros y señas con Mercado Pago", free: false, pro: true },
  { feature: "Estadísticas y reportes contables", free: false, pro: true },
  { feature: "Bloqueos de agenda (vacaciones, francos)", free: true, pro: true },
] as const;

function Comparativa() {
  const precio = formatoARS.format(PRECIO_PRO_ARS);
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          Precios
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Gratis para empezar. Pro para crecer.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Probá Agendalo sin pagar nada. Cuando necesites recordatorios automáticos y cobros online, activás Pro.
        </p>
      </header>
      <MotionReveal
        className="mt-10 grid gap-4 md:grid-cols-2"
        immediate={false}
      >
        <div
          data-reveal
          className="flex flex-col rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur"
        >
          <h3 className="text-lg font-semibold">Free</h3>
          <p className="mt-1 text-sm text-muted-foreground sm:min-h-11">
            Todo lo necesario para tener tu agenda online y empezar a recibir reservas.
          </p>
          <p className="mt-6">
            <span className="text-3xl font-semibold">$ 0</span>
            <span className="ml-1 text-sm text-muted-foreground">/ mes</span>
          </p>
          <Button
            className="mt-6"
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/sign-up" />}
          >
            Empezar gratis
          </Button>
          <ul className="mt-6 flex flex-col gap-2 text-sm">
            {PLAN_ROWS.map((r) => (
              <li key={r.feature} className="flex items-start gap-2">
                {r.free ? (
                  <Check className="mt-0.5 size-4 text-success" strokeWidth={1.5} />
                ) : (
                  <Minus className="mt-0.5 size-4 text-subtle" strokeWidth={1.5} />
                )}
                <span className={r.free ? "" : "text-muted-foreground line-through"}>
                  {r.feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          data-reveal
          className="ring-gradient-brand glow-violet relative flex flex-col rounded-2xl bg-surface/70 p-6 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              <span className="text-gradient-brand">Pro</span>
            </h3>
            <Badge
              variant="secondary"
              className="bg-gradient-brand border-0 font-medium text-white"
            >
              Recomendado
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground sm:min-h-11">
            Reducí ausencias con recordatorios automáticos, cobrá online y
            analizá el crecimiento de tu negocio.
          </p>
          <p className="mt-6">
            <span className="text-3xl font-semibold">{precio}</span>
            <span className="ml-1 text-sm text-muted-foreground">/ mes</span>
          </p>
          <Button
            className="mt-6"
            size="lg"
            nativeButton={false}
            render={<Link href="/sign-up" />}
          >
            Probar Pro
          </Button>
          <ul className="mt-6 flex flex-col gap-2 text-sm">
            {PLAN_ROWS.map((r) => (
              <li key={r.feature} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-success" strokeWidth={1.5} />
                <span>{r.feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </MotionReveal>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: "¿Cuánto cuesta Agendalo?",
    a: `El plan Free es gratis para siempre. El plan Pro cuesta ${formatoARS.format(
      PRECIO_PRO_ARS,
    )} por mes e incluye recordatorios automáticos, cobros online y estadísticas. Sin contrato ni permanencia: lo activás solo cuando lo necesitás.`,
  },
  {
    q: "¿Qué diferencia hay entre Free y Pro?",
    a: "Con Free tenés tu agenda online: página pública con tu link, servicios y horarios ilimitados, reservas sin registro para el cliente y bloqueos de agenda. Pro suma lo que automatiza y hace crecer tu negocio: recordatorios por WhatsApp, cobros con Mercado Pago y estadísticas.",
  },
  {
    q: "¿Necesito tarjeta de crédito para empezar?",
    a: "No. El plan Free es gratis para siempre y no requiere tarjeta. Más adelante, si querés activar WhatsApp o cobros online, podés suscribirte al plan Pro desde el panel.",
  },
  {
    q: "¿Para qué rubros sirve Agendalo?",
    a: "Para cualquier profesional que trabaje con turnos: peluquerías y barberías, kinesiología, psicología, estética, tatuajes, nutrición y muchos más. Si das turnos, te sirve.",
  },
  {
    q: "¿Cómo empiezo?",
    a: "Te registrás gratis, cargás tus servicios y tus horarios de atención, y compartís tu link de reservas. En menos de 5 minutos ya podés recibir tu primer turno.",
  },
  {
    q: "¿Mis clientes tienen que crear una cuenta?",
    a: "No. Reservan desde tu link público en solo 3 pasos: eligen el servicio, el día y el horario. Solo dejan su nombre, teléfono y, si quieren, su email.",
  },
  {
    q: "¿Cómo funcionan los cobros con Mercado Pago?",
    a: "Conectás tu cuenta de Mercado Pago una sola vez. Si un servicio requiere pago, el cliente abona al reservar y el dinero se acredita directamente en tu cuenta. Agendalo nunca toca tu plata.",
  },
  {
    q: "¿Puedo cobrar por transferencia o efectivo?",
    a: "Sí. Por cada servicio elegís el método: Mercado Pago, transferencia (mostrás tu CBU/Alias) o efectivo en el lugar. Vos decidís si pedís una seña, el total o si el turno es sin pago.",
  },
  {
    q: "¿Los recordatorios por WhatsApp tienen costo extra?",
    a: "No. Están incluidos en el plan Pro y se envían automáticamente 24 horas y 1 hora antes del turno.",
  },
  {
    q: "¿Puedo bloquear vacaciones o francos?",
    a: "Sí. Bloqueás las fechas que quieras —vacaciones, feriados o un franco puntual— y durante ese período no vas a recibir reservas en esos días.",
  },
  {
    q: "¿Necesito instalar algo? ¿Funciona en el celular?",
    a: "No hace falta instalar nada. Agendalo funciona desde el navegador, tanto en la computadora como en el celular, para vos y para tus clientes.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. Sin penalidades ni permanencia. Podés cancelar desde Configuración → Plan y mantener el acceso Pro hasta el final de tu período actual.",
  },
] as const;

function FAQ() {
  // Dos columnas independientes en desktop: al abrir una pregunta, solo se
  // empujan las de abajo de su propia columna (no descoloca la otra).
  const mitad = Math.ceil(FAQ_ITEMS.length / 2);
  const columnas = [FAQ_ITEMS.slice(0, mitad), FAQ_ITEMS.slice(mitad)];
  return (
    <div className="mx-auto w-full max-w-[920px]">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          FAQ
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Preguntas frecuentes
        </h2>
      </header>
      <div className="mt-8 grid items-start gap-3 lg:grid-cols-2">
        {columnas.map((col, i) => (
          <div key={i} className="flex flex-col gap-3">
            {col.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-surface/80 px-5 py-4 backdrop-blur [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                  {item.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Contacto() {
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          Contacto
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          ¿Tenés dudas? Escribinos
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Te respondemos por mail lo antes posible.
        </p>
      </header>
      <div className="mt-8">
        <ContactForm />
      </div>
      <div className="mx-auto mt-6 flex w-full max-w-[640px] flex-col gap-4 rounded-2xl border border-border bg-surface/60 p-5 text-left backdrop-blur sm:flex-row sm:items-center">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-elevated ring-1 ring-secondary/20">
          <HeartHandshake className="size-4 text-secondary" strokeWidth={1.5} />
        </span>
        <p className="flex-1 text-sm text-muted-foreground">
          No te dejamos solo. Atención personalizada y soporte rápido cuando lo
          necesites.
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" />
          }
          className="shrink-0 gap-2"
        >
          <MessageCircle className="size-4" strokeWidth={1.75} />
          WhatsApp
        </Button>
      </div>
    </div>
  );
}
