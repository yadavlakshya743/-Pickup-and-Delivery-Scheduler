/*
  Warnings:

  - Added the required column `password` to the `USERS` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "USERS" ADD COLUMN     "password" TEXT NOT NULL;
