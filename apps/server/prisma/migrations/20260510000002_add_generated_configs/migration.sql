-- CreateTable
CREATE TABLE "generated_configs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "generated_configs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "generated_configs" ADD CONSTRAINT "generated_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
