/*
  Warnings:

  - You are about to drop the column `website` on the `lead_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "lead_data" DROP COLUMN "website",
ADD COLUMN     "company_website" VARCHAR(200),
ADD COLUMN     "contact_accuracy_grade" VARCHAR(10),
ADD COLUMN     "contact_accuracy_score" INTEGER,
ADD COLUMN     "email_domain" VARCHAR(100),
ADD COLUMN     "job_start_date" DATE;
