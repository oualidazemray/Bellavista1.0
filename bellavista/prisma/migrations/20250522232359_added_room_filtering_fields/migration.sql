/*
  Warnings:

  - Added the required column `maxGuests` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoomView" AS ENUM ('CITY', 'PARK', 'POOL', 'COURTYARD', 'GARDEN', 'OTHER');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "characteristics" TEXT[],
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "maxGuests" INTEGER NOT NULL,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "view" "RoomView";
