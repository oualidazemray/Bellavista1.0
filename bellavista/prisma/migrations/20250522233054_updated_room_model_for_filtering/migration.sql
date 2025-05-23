/*
  Warnings:

  - You are about to drop the column `pricing` on the `HotelInfo` table. All the data in the column will be lost.
  - You are about to drop the column `available` on the `Room` table. All the data in the column will be lost.
  - Added the required column `numAdults` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoomView" ADD VALUE 'OCEAN';
ALTER TYPE "RoomView" ADD VALUE 'MOUNTAIN';

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "twoFASecret" DROP NOT NULL;

-- AlterTable
ALTER TABLE "HotelInfo" DROP COLUMN "pricing",
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "numAdults" INTEGER NOT NULL,
ADD COLUMN     "numChildren" INTEGER,
ADD COLUMN     "promoCodeUsed" TEXT;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "available",
ADD COLUMN     "bedConfiguration" TEXT,
ADD COLUMN     "beds" INTEGER,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "sqMeters" DOUBLE PRECISION;
