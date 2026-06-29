/*
  Warnings:

  - The `indexStatus` column on the `repos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RepoIndexStatus" AS ENUM ('pending', 'indexing', 'done', 'failed');

-- CreateEnum
CREATE TYPE "ChunkType" AS ENUM ('function', 'class', 'method', 'text');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('javascript', 'typescript', 'tsx', 'unknown');

-- AlterTable
ALTER TABLE "repos" DROP COLUMN "indexStatus",
ADD COLUMN     "indexStatus" "RepoIndexStatus" NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "repo_chunks" (
    "id" TEXT NOT NULL,
    "type" "ChunkType" NOT NULL,
    "name" TEXT,
    "language" "Language" NOT NULL,
    "startLine" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,
    "sourceText" TEXT NOT NULL,
    "isExported" BOOLEAN NOT NULL,
    "isAsync" BOOLEAN NOT NULL,
    "isGenerator" BOOLEAN NOT NULL,
    "repoId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repo_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "repo_chunks_repoId_idx" ON "repo_chunks"("repoId");

-- CreateIndex
CREATE INDEX "repo_chunks_fileId_idx" ON "repo_chunks"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "repo_chunks_fileId_startLine_endLine_key" ON "repo_chunks"("fileId", "startLine", "endLine");

-- AddForeignKey
ALTER TABLE "repo_chunks" ADD CONSTRAINT "repo_chunks_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "repos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repo_chunks" ADD CONSTRAINT "repo_chunks_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "repo_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
