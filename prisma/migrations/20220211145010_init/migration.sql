/*
  Warnings:

  - You are about to drop the column `type` on the `Control` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Control` DROP COLUMN `type`,
    ADD COLUMN `data` JSON NOT NULL;
