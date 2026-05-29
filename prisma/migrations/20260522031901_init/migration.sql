-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('PENDIENTE_PAGO', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO');

-- CreateTable
CREATE TABLE "Profesional" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "fotoUrl" TEXT,
    "telefono" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "mpAccessToken" TEXT,
    "mpUserId" TEXT,
    "mpSubscriptionId" TEXT,
    "planExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionMinutos" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "requierePago" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorarioDisponible" (
    "id" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,

    CONSTRAINT "HorarioDisponible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bloqueo" (
    "id" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,

    CONSTRAINT "Bloqueo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteTelefono" TEXT NOT NULL,
    "clienteEmail" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'CONFIRMADO',
    "mpPaymentId" TEXT,
    "recordatorio24hEnviado" BOOLEAN NOT NULL DEFAULT false,
    "recordatorio1hEnviado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoWebhook" (
    "id" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "procesadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_clerkUserId_key" ON "Profesional"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_slug_key" ON "Profesional"("slug");

-- CreateIndex
CREATE INDEX "Profesional_slug_idx" ON "Profesional"("slug");

-- CreateIndex
CREATE INDEX "Servicio_profesionalId_idx" ON "Servicio"("profesionalId");

-- CreateIndex
CREATE INDEX "HorarioDisponible_profesionalId_idx" ON "HorarioDisponible"("profesionalId");

-- CreateIndex
CREATE INDEX "Bloqueo_profesionalId_fechaInicio_idx" ON "Bloqueo"("profesionalId", "fechaInicio");

-- CreateIndex
CREATE INDEX "Turno_profesionalId_fechaInicio_idx" ON "Turno"("profesionalId", "fechaInicio");

-- CreateIndex
CREATE INDEX "Turno_estado_fechaInicio_idx" ON "Turno"("estado", "fechaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "EventoWebhook_proveedor_externalId_key" ON "EventoWebhook"("proveedor", "externalId");

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioDisponible" ADD CONSTRAINT "HorarioDisponible_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bloqueo" ADD CONSTRAINT "Bloqueo_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
