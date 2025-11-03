-- CreateTable
CREATE TABLE "email_summary" (
    "id" SERIAL NOT NULL,
    "zoominfo_contact_id" BIGINT NOT NULL,
    "name" VARCHAR(200),
    "email" VARCHAR(150),
    "thread_id" VARCHAR(200),
    "email_body_summary" TEXT,
    "sentiment" VARCHAR(50),
    "category" VARCHAR(100),
    "summary_generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_summary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "email_summary" ADD CONSTRAINT "email_summary_zoominfo_contact_id_fkey" FOREIGN KEY ("zoominfo_contact_id") REFERENCES "lead_data"("zoominfo_contact_id") ON DELETE CASCADE ON UPDATE CASCADE;
