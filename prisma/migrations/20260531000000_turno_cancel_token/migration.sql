-- AlterTable
ALTER TABLE "Turno" ADD COLUMN "cancelToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Turno_cancelToken_key" ON "Turno"("cancelToken");
