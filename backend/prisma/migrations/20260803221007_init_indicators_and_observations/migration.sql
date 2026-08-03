-- CreateTable
CREATE TABLE "indicators" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    "sync_ttl_minutes" INTEGER NOT NULL,
    "refresh_cooldown_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicator_observations" (
    "id" TEXT NOT NULL,
    "indicator_id" TEXT NOT NULL,
    "reference_date" DATE NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicator_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indicators_code_key" ON "indicators"("code");

-- CreateIndex
CREATE UNIQUE INDEX "indicator_observations_indicator_id_reference_date_key" ON "indicator_observations"("indicator_id", "reference_date");

-- AddForeignKey
ALTER TABLE "indicator_observations" ADD CONSTRAINT "indicator_observations_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
