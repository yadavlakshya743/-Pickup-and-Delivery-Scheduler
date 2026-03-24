/*
  Warnings:

  - You are about to drop the column `name` on the `AGENTS` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `AGENTS` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `AGENTS` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `AGENTS` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'AGENT', 'OPERATOR');

-- AlterTable
ALTER TABLE "AGENTS" DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "USERS" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CUSTOMER';

-- CreateIndex
CREATE UNIQUE INDEX "AGENTS_user_id_key" ON "AGENTS"("user_id");

-- AddForeignKey
ALTER TABLE "AGENTS" ADD CONSTRAINT "AGENTS_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USERS"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
