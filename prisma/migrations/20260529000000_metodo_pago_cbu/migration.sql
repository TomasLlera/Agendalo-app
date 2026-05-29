-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('MERCADOPAGO', 'TRANSFERENCIA', 'EFECTIVO', 'SIN_PAGO');

-- AlterTable
ALTER TABLE "Servicio" ADD COLUMN "metodoPago" "MetodoPago" NOT NULL DEFAULT 'MERCADOPAGO';

-- CreateTable
CREATE TABLE "DatosBancarios" (
    "id" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "cbu" TEXT,
    "alias" TEXT,
    "banco" TEXT,
    "titular" TEXT,
    "cuit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosBancarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosBancarios_profesionalId_key" ON "DatosBancarios"("profesionalId");

-- AddForeignKey
ALTER TABLE "DatosBancarios" ADD CONSTRAINT "DatosBancarios_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
