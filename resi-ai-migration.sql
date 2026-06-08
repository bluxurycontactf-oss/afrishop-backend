-- Migration Assistant IA ResiGo (apprentissage supervisé)
-- Exécuter dans Supabase SQL Editor

CREATE TABLE "resi_ai_unanswered" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "question"  TEXT NOT NULL,
  "count"     INTEGER NOT NULL DEFAULT 1,
  "lastAsked" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "resi_ai_unanswered_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "resi_ai_knowledge" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "keywords"  TEXT NOT NULL,
  "answer"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "resi_ai_knowledge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resi_ai_unanswered_count_idx" ON "resi_ai_unanswered"("count" DESC);
