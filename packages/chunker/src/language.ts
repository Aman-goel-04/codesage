import Parser, { type Language } from "tree-sitter";
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

function createParser(language: typeof Javascript) {
    const parser = new Parser();
    parser.setLanguage(language as Parser.Language);
    return parser;
}

export const PARSERS = {
    javascript: createParser(Javascript),
    typescript: createParser(Typescript.typescript),
    tsx: createParser(Typescript.tsx),
} as const;

type A = typeof Javascript;
type B = Language;
type C = Parameters<Parser["setLanguage"]>[0];

export type SupportedLanguage = keyof typeof LANGUAGES;