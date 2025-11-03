/*
  Warnings:

  - You are about to drop the column `contact_accuracy_grade` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `contact_accuracy_score` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `email_domain` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `follow_up_count` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `job_start_date` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `last_email_sent_at` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `last_replied_at` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_scheduled_at` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `next_follow_up_at` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `lead_data` table. All the data in the column will be lost.
  - You are about to drop the column `thread_id` on the `lead_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "lead_data" DROP COLUMN "contact_accuracy_grade",
DROP COLUMN "contact_accuracy_score",
DROP COLUMN "email_domain",
DROP COLUMN "follow_up_count",
DROP COLUMN "job_start_date",
DROP COLUMN "last_email_sent_at",
DROP COLUMN "last_replied_at",
DROP COLUMN "meeting_scheduled_at",
DROP COLUMN "next_follow_up_at",
DROP COLUMN "status",
DROP COLUMN "thread_id";

-- CreateTable
CREATE TABLE "lead_status" (
    "id" SERIAL NOT NULL,
    "zoominfo_contact_id" BIGINT NOT NULL,
    "status" VARCHAR(50) DEFAULT 'new',
    "contact_accuracy_score" INTEGER,
    "contact_accuracy_grade" VARCHAR(10),
    "job_start_date" DATE,
    "last_email_sent_at" TIMESTAMP(3),
    "last_replied_at" TIMESTAMP(3),
    "follow_up_count" INTEGER DEFAULT 0,
    "thread_id" VARCHAR(200),
    "next_follow_up_at" TIMESTAMP(3),
    "meeting_scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_status_zoominfo_contact_id_key" ON "lead_status"("zoominfo_contact_id");

-- AddForeignKey
ALTER TABLE "lead_status" ADD CONSTRAINT "lead_status_zoominfo_contact_id_fkey" FOREIGN KEY ("zoominfo_contact_id") REFERENCES "lead_data"("zoominfo_contact_id") ON DELETE CASCADE ON UPDATE CASCADE;
