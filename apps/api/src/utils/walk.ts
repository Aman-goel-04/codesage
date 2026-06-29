import fs from "fs";
import path from "path";

const MAX_FILE_SIZE = 500 * 1024;
const SKIP_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	".git",
	".github",
	".next",
	".cache",
]);

const SKIP_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".svg",
	".ico",
	".pdf",
	".zip",
	".gz",
	".tar",
	".mp3",
	".mp4",
	".mov",
	".woff",
	".woff2",
	".ttf",
	".exe",
	".dll",
	".so",
	".class",
	".jar",
]);

export type FileEntry = {
	path: string;
	content: string;
};

export function walk(dir: string): FileEntry[] {
	const results: FileEntry[] = [];

	function traverse(currentPath: string) {
		const entries = fs.readdirSync(currentPath, {
			withFileTypes: true,
		});

		for (const entry of entries) {
			const fullPath = path.join(currentPath, entry.name);

			if (entry.isDirectory()) {
				if (SKIP_DIRS.has(entry.name)) {
					continue;
				}

				traverse(fullPath);
			} else if (entry.isFile()) {
				const ext = path.extname(fullPath);

				if (SKIP_EXTENSIONS.has(ext)) {
					continue;
				}

				try {
					const stats = fs.statSync(fullPath);

					if (stats.size > MAX_FILE_SIZE) {
						continue;
					}

					const content = fs.readFileSync(fullPath, "utf8");

					results.push({
						path: path.relative(dir, fullPath),
						content,
					});
				} catch {
					console.log("Failed:", fullPath);
				}
			}
		}
	}

	traverse(dir);

	return results;
}
