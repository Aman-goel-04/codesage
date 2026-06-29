import fs from "fs";
import { simpleGit } from "simple-git";
import { walk } from "../utils/walk.js";
import { prisma } from "@repo/db";
import { chunkFile, type Chunk } from "@repo/chunker";
import path from "path";
import { randomUUID } from "crypto";

const CHUNK_BATCH_SIZE = 1000;

export async function ingestRepo(repoId: string, repoUrl: string) {
	const dir = path.join("/tmp", `${repoId}-${randomUUID()}`);

	try {
		await simpleGit().clone(repoUrl, dir);

		const files = walk(dir);
		console.log("Files:", files.length);
		// console.log(files.map(f => f.path));

		const allChunks: Chunk[] = [];

		for (const file of files) {
			console.log("Chunking:", file.path);

			const chunks = chunkFile(file.path, file.content);

			console.log(` -> ${chunks.length} chunks`);

			allChunks.push(...chunks);
		}

		console.log(`generated ${allChunks.length} chunks.`);

		await prisma.$transaction(async (tx) => {
			await tx.repoFile.createMany({
				data: files.map((file) => ({
					repoId,
					path: file.path,
					content: file.content,
				})),
				skipDuplicates: true,
			});

			const repoFiles = await tx.repoFile.findMany({
				where: { repoId },
				select: {
					id: true,
					path: true,
				},
			});

			const fileIdMap = new Map<string, string>(
				repoFiles.map((file) => [file.path, file.id]),
			);

			for (let i = 0; i < allChunks.length; i += CHUNK_BATCH_SIZE) {
				const batch = allChunks.slice(i, i + CHUNK_BATCH_SIZE);

				await tx.repoChunk.createMany({
					data: batch.map((chunk) => {
						const fileId = fileIdMap.get(chunk.filePath);

						if (!fileId) {
							throw new Error(
								`Missing RepoFile for "${chunk.filePath}"`,
							);
						}

						return {
							repoId,
							fileId,

							type: chunk.type,
							name: chunk.name,

							language: chunk.language,

							startLine: chunk.startLine,
							endLine: chunk.endLine,

							sourceText: chunk.sourceText,

							isExported: chunk.isExported,
							isAsync: chunk.isAsync,
							isGenerator: chunk.isGenerator,
						};
					}),
					skipDuplicates: true,
				});
			}

			await tx.repo.update({
				where: { id: repoId },
				data: {
					isIndexed: true,
					indexStatus: "done",
				},
			});
		});
	} catch (e) {
		console.error("Repository ingestion failed:", e);

		await prisma.repo.update({
			where: { id: repoId },
			data: {
				indexStatus: "failed",
			},
		});

		throw e;
	} finally {
		fs.rmSync(dir, {
			recursive: true,
			force: true,
		});
	}
}
