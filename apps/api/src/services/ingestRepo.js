import fs from "fs";
import { simpleGit } from "simple-git";
import { walk } from "../utils/walk.js";
import { prisma } from "@repo/db";
export async function ingestRepo(repoId, repoUrl) {
    const dir = `/tmp/${repoId}`;
    try {
        await simpleGit().clone(repoUrl, dir);
        const files = walk(dir);
        // console.log(files.map(f => f.path));
        await prisma.repoFile.createMany({
            data: files.map((f) => ({
                repoId,
                path: f.path,
                content: f.content,
            })),
        });
        await prisma.repo.update({
            where: { id: repoId },
            data: {
                isIndexed: true,
                indexStatus: "done",
            },
        });
    }
    catch (e) {
        console.log(e);
        await prisma.repo.update({
            where: { id: repoId },
            data: {
                indexStatus: "failed",
            },
        });
        throw e;
    }
    finally {
        fs.rmSync(dir, {
            recursive: true,
            force: true,
        });
    }
}
//# sourceMappingURL=ingestRepo.js.map