/*
  Warnings:

  - A unique constraint covering the columns `[userId,reservationId]` on the table `Feedback` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rating` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reservationId` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ReservationStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "rating" INTEGER NOT NULL,
ADD COLUMN     "reservationId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_userId_reservationId_key" ON "Feedback"("userId", "reservationId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
