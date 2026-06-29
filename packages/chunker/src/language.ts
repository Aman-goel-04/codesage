import Javascript from "tree-sitter-javascript";
import Typescript from "tree-sitter-typescript";

export const EXTENSION_TO_LANGUAGE = {
	".js": "javascript",
	".mjs": "javascript",
	".cjs": "javascript",

	".ts": "typescript",
	".tsx": "tsx",
} as const;

export const LANGUAGES = {
	javascript: Javascript,
	typescript: Typescript.typescript,
	tsx: Typescript.tsx,
} as const;

export function getLanguageFromExtension(extension: string) {
	if (!(extension in EXTENSION_TO_LANGUAGE)) {
		return null;
	}

	return EXTENSION_TO_LANGUAGE[
		extension as keyof typeof EXTENSION_TO_LANGUAGE
	];
}

export type SupportedLanguage = keyof typeof LANGUAGES;