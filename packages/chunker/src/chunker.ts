import Parser from "tree-sitter";
import { getLanguageFromExtension, PARSERS } from "./language.js";
import path from "node:path";

import type { SupportedLanguage } from "./language.js";

export type ChunkType = "function" | "class" | "method" | "text";

export type Chunk = {
	type: ChunkType;
	name: string | null;

	isExported: boolean;
	isAsync: boolean;
	isGenerator: boolean;

	startLine: number;
	endLine: number;

	sourceText: string;

	language: SupportedLanguage | "unknown";
	filePath: string;
};

function isFunctionNode(node: Parser.SyntaxNode | null): boolean {
	return (
		!!node &&
		(node.type === "arrow_function" ||
			node.type === "function_expression" ||
			node.type === "function_declaration")
	);
}

function hasToken(node: Parser.SyntaxNode, token: string): boolean {
	return node.children.some((child) => child.type === token);
}

function isAsync(node: Parser.SyntaxNode): boolean {
	return hasToken(node, "async");
}

function isGenerator(node: Parser.SyntaxNode): boolean {
	return hasToken(node, "*");
}

function isExported(node: Parser.SyntaxNode): boolean {
	let current: Parser.SyntaxNode | null = node;

	while (current) {
		if (current.type === "export_statement") return true;

		current = current.parent;
	}

	return false;
}

function makeChunk(
	node: Parser.SyntaxNode,
	kind: Chunk["type"],
	name: string | null,
	language: SupportedLanguage | "unknown",
	filePath: string,
): Chunk {
	return {
		type: kind,
		name,
		isExported: isExported(node),
		isAsync: isAsync(node),
		isGenerator: isGenerator(node),
		startLine: node.startPosition.row + 1,
		endLine: node.endPosition.row + 1,
		sourceText: node.text,
		language,
		filePath,
	};
}

function getNodeInfo(
	node: Parser.SyntaxNode,
	language: SupportedLanguage | "unknown",
	filePath: string,
): Chunk | null {
	switch (node.type) {
		case "function_declaration":
			return makeChunk(
				node,
				"function",
				node.childForFieldName("name")?.text ?? null,
				language,
				filePath,
			);
		case "class_declaration":
			return makeChunk(
				node,
				"class",
				node.childForFieldName("name")?.text ?? null,
				language,
				filePath,
			);
		case "method_definition":
			return makeChunk(
				node,
				"method",
				node.childForFieldName("name")?.text ??
					node.childForFieldName("property")?.text ??
					null,
				language,
				filePath,
			);
		case "variable_declarator": {
			const value = node.childForFieldName("value");

			if (!isFunctionNode(value)) return null;

			const nameNode = node.childForFieldName("name");

			if (
				nameNode?.type === "object_pattern" ||
				nameNode?.type === "array_pattern"
			) {
				return null;
			}

			return makeChunk(
				value!,
				"function",
				nameNode?.text ?? null,
				language,
				filePath,
			);
		}
		case "pair": {
			const value = node.childForFieldName("value");

			if (!isFunctionNode(value)) return null;

			return makeChunk(
				value!,
				"method",
				node.childForFieldName("key")?.text ?? null,
				language,
				filePath,
			);
		}

		default:
			return null;
	}
}

function traverse(
	node: Parser.SyntaxNode,
	language: SupportedLanguage | "unknown",
	filePath: string,
	chunks: Chunk[],
) {
	const chunk = getNodeInfo(node, language, filePath);

	if (chunk) {
		chunks.push(chunk);
	}

	for (const child of node.namedChildren) {
		traverse(child, language, filePath, chunks);
	}
}

function chunkFallback(
	content: string,
	language: SupportedLanguage | "unknown",
	filePath: string,
): Chunk[] {
	const CHUNK_SIZE = 1200; //1k characters
	const OVERLAP = 200; //overlap size;to not lose context, will make these windows: 0-1200, 1000-2200, ...

	const chunks: Chunk[] = [];

	let currentLine = 1;
	let start = 0;

	while (start < content.length) {
		const end = Math.min(start + CHUNK_SIZE, content.length);

		const text = content.slice(start, end);

		const endLine = currentLine + (text.match(/\n/g)?.length ?? 0);

		chunks.push({
			type: "text",
			name: null,
			isExported: false,
			isAsync: false,
			isGenerator: false,
			startLine: currentLine,
			endLine,
			sourceText: text,
			language,
			filePath,
		});

		const overlapStart = end - OVERLAP;

		currentLine =
			(content.slice(0, overlapStart).match(/\n/g)?.length ?? 0) + 1;

		if (end === content.length) {
			break;
		}

		start = Math.max(start + 1, end - OVERLAP);
	}
	return chunks;
}

export function chunkFile(filePath: string, fileContent: string): Chunk[] {
	const extension = path.extname(filePath);
	const language = getLanguageFromExtension(extension);

	if (!language) return chunkFallback(fileContent, "unknown", filePath);

	try {
		const tree = PARSERS[language].parse(fileContent);

		const chunks: Chunk[] = [];

		traverse(tree.rootNode, language, filePath, chunks);

		if (chunks.length === 0)
			return chunkFallback(fileContent, "unknown", filePath);

		return chunks;
	} catch {
		return chunkFallback(fileContent, "unknown", filePath);
	}
}
