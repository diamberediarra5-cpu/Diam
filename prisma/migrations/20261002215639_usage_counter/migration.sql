-- CreateTable
CREATE TABLE "usage_counter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "quotesCreated" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usage_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usage_counter_userId_period_key" ON "usage_counter"("userId", "period");

-- AddForeignKey
ALTER TABLE "usage_counter" ADD CONSTRAINT "usage_counter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
