-- CreateTable
CREATE TABLE "Miembro" (
    "id" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Miembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiembroServicio" (
    "miembroId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,

    CONSTRAINT "MiembroServicio_pkey" PRIMARY KEY ("miembroId","servicioId")
);

-- AlterTable
ALTER TABLE "Turno" ADD COLUMN "miembroId" TEXT;

-- CreateIndex
CREATE INDEX "Miembro_profesionalId_idx" ON "Miembro"("profesionalId");

-- CreateIndex
CREATE INDEX "MiembroServicio_servicioId_idx" ON "MiembroServicio"("servicioId");

-- CreateIndex
CREATE INDEX "Turno_miembroId_fechaInicio_idx" ON "Turno"("miembroId", "fechaInicio");

-- AddForeignKey
ALTER TABLE "Miembro" ADD CONSTRAINT "Miembro_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroServicio" ADD CONSTRAINT "MiembroServicio_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroServicio" ADD CONSTRAINT "MiembroServicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: un miembro "dueño" por cada cuenta existente. El id se deriva del
-- profesionalId ('m' + id) para que el backfill sea idempotente y permita
-- enlazar servicios y turnos sin un paso intermedio.
INSERT INTO "Miembro" ("id", "profesionalId", "nombre", "fotoUrl", "activo", "createdAt")
SELECT 'm' || p."id", p."id", p."nombre", p."fotoUrl", true, CURRENT_TIMESTAMP
FROM "Profesional" p;

-- Backfill: el miembro dueño puede prestar todos los servicios activos de su cuenta.
INSERT INTO "MiembroServicio" ("miembroId", "servicioId")
SELECT 'm' || s."profesionalId", s."id"
FROM "Servicio" s
WHERE s."activo" = true;

-- Backfill: todos los turnos existentes quedan a cargo del miembro dueño.
UPDATE "Turno" SET "miembroId" = 'm' || "profesionalId" WHERE "miembroId" IS NULL;

-- AddForeignKey (después del backfill, con los valores ya consistentes)
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
