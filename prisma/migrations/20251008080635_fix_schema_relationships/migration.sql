/*
  Warnings:

  - You are about to drop the column `message` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `chat_messages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `diet_plans` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `chat_messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chat_messages" DROP COLUMN "message",
DROP COLUMN "response",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "diet_plans_user_id_key" ON "diet_plans"("user_id");
