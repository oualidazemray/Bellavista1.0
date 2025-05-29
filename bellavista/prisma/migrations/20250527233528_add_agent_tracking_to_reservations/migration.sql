-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "createdByAgentId" TEXT;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdByAgentId_fkey" FOREIGN KEY ("createdByAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
