-- Migration Resi Group
-- Exécuter dans Supabase SQL Editor

CREATE TYPE "ResiRequestType" AS ENUM (
  'STREAMING', 'IMMOBILIER', 'VOLS', 'VOITURES',
  'LIVRAISON', 'RESTAURATION', 'SERVICES', 'CONTACT'
);

CREATE TYPE "ResiRequestStatus" AS ENUM (
  'NEW', 'IN_PROGRESS', 'DONE', 'CANCELLED'
);

CREATE TABLE "resi_content" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "key"       TEXT NOT NULL,
  "data"      JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "resi_content_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "resi_content_key_key" UNIQUE ("key")
);

CREATE TABLE "resi_requests" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "type"      "ResiRequestType" NOT NULL,
  "name"      TEXT NOT NULL,
  "phone"     TEXT NOT NULL,
  "email"     TEXT,
  "subject"   TEXT,
  "message"   TEXT,
  "status"    "ResiRequestStatus" NOT NULL DEFAULT 'NEW',
  "data"      JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "resi_requests_pkey" PRIMARY KEY ("id")
);

-- Index pour les recherches fréquentes
CREATE INDEX "resi_requests_type_idx"   ON "resi_requests"("type");
CREATE INDEX "resi_requests_status_idx" ON "resi_requests"("status");
CREATE INDEX "resi_requests_created_idx" ON "resi_requests"("createdAt" DESC);
