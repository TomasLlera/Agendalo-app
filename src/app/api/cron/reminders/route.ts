import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isPro } from "@/lib/plan";
import {
  sendReminder,
  type TipoRecordatorio,
} from "@/lib/twilio/whatsapp";

// Twilio + Prisma → necesitamos runtime Node, no Edge.
export const runtime = "nodejs";
// Evitar cache estático: este endpoint cambia estado en DB.
export const dynamic = "force-dynamic";

type ErrorTurno = { turnoId: string; mensaje: string };

type Resultado = {
  tipo: TipoRecordatorio;
  evaluados: number;
  enviados: number;
  saltadosFree: number;
  errores: ErrorTurno[];
};

/**
 * Endpoint disparado por Vercel Cron cada 15 minutos. Envía recordatorios
 * WhatsApp para los turnos confirmados que entran en la ventana 24h y 1h.
 *
 * Autorización: header `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron
 * agrega ese header automáticamente cuando `CRON_SECRET` está definido en el
 * proyecto. Llamadas sin el header válido devuelven 401.
 *
 * Gate por plan: sólo profesionales con `isPro` activo (incluye grace period
 * por `planExpiresAt`). Es el gancho del paywall — los Free quedan registrados
 * en `saltadosFree` pero no se les envía nada y la flag NO se marca, para que
 * si pasan a Pro reciban los recordatorios pendientes.
 *
 * Errores por turno se loguean y registran en el resultado pero no abortan el
 * batch. La flag `recordatorio*hEnviado` se marca sólo en envíos exitosos.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron:reminders] CRON_SECRET no configurado");
    return new Response("Cron no configurado", { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ahora = new Date();
  const resultado24 = await procesarVentana(ahora, "24h");
  const resultado1 = await procesarVentana(ahora, "1h");

  return NextResponse.json({
    ok: true,
    timestamp: ahora.toISOString(),
    resultados: [resultado24, resultado1],
  });
}

async function procesarVentana(
  ahora: Date,
  tipo: TipoRecordatorio,
): Promise<Resultado> {
  const { desde, hasta } = ventana(ahora, tipo);
  const turnos = await prisma.turno.findMany({
    where: {
      estado: "CONFIRMADO",
      fechaInicio: { gte: desde, lt: hasta },
      ...(tipo === "24h"
        ? { recordatorio24hEnviado: false }
        : { recordatorio1hEnviado: false }),
    },
    select: {
      id: true,
      clienteNombre: true,
      clienteTelefono: true,
      fechaInicio: true,
      servicio: { select: { nombre: true } },
      profesional: {
        select: {
          nombre: true,
          timezone: true,
          plan: true,
          planExpiresAt: true,
        },
      },
    },
  });

  const resultado: Resultado = {
    tipo,
    evaluados: turnos.length,
    enviados: 0,
    saltadosFree: 0,
    errores: [],
  };

  for (const turno of turnos) {
    if (!isPro(turno.profesional)) {
      resultado.saltadosFree++;
      continue;
    }
    try {
      await sendReminder(
        {
          id: turno.id,
          clienteNombre: turno.clienteNombre,
          clienteTelefono: turno.clienteTelefono,
          fechaInicio: turno.fechaInicio,
          servicio: { nombre: turno.servicio.nombre },
          profesional: {
            nombre: turno.profesional.nombre,
            timezone: turno.profesional.timezone,
          },
        },
        tipo,
      );
      await prisma.turno.update({
        where: { id: turno.id },
        data:
          tipo === "24h"
            ? { recordatorio24hEnviado: true }
            : { recordatorio1hEnviado: true },
      });
      resultado.enviados++;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err);
      console.error(
        `[cron:reminders] turno=${turno.id} tipo=${tipo} error=${mensaje}`,
      );
      resultado.errores.push({ turnoId: turno.id, mensaje });
    }
  }

  return resultado;
}

/**
 * Ventanas de búsqueda según el blueprint:
 *  - 24h: turnos cuyo `fechaInicio` cae entre ahora+23h y ahora+25h
 *  - 1h:  turnos cuyo `fechaInicio` cae entre ahora+30m y ahora+90m
 *
 * La amplitud (~2h y 1h) cubre el intervalo de 15 minutos del cron + algo de
 * tolerancia ante demoras. La flag por turno evita duplicados.
 */
function ventana(
  ahora: Date,
  tipo: TipoRecordatorio,
): { desde: Date; hasta: Date } {
  if (tipo === "24h") {
    return {
      desde: agregarMinutos(ahora, 23 * 60),
      hasta: agregarMinutos(ahora, 25 * 60),
    };
  }
  return {
    desde: agregarMinutos(ahora, 30),
    hasta: agregarMinutos(ahora, 90),
  };
}

function agregarMinutos(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60 * 1000);
}
