import Parser from "tree-sitter";
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ext = path.extname(__filename);
const __dirname = path.dirname(__filename);

const parser = new Parser();

type Chunk = {
type: string,
name: string | null,
startLine: number,
endLine: number,
sourceText: string,
language: string,
filePath: string
}

function getNodeInfo(
node: Parser.SyntaxNode,
language: string,
filePath: string,
): Chunk | null {
    let name: string | null = null;

    switch (node.type) {
        case "function_declaration":
        case "class_declaration":
        case "method_definition": {
            name = node.childForFieldName("name")?.text ?? null;
            break;
        }

        case "arrow_function":
        case "function_expression": {
            const variableDeclarator = node.parent;

            if (
                variableDeclarator &&
                variableDeclarator.type === "variable_declarator"
            ) {
                name =
                    variableDeclarator
                        .childForFieldName("name")
                        ?.text ?? null;
            }

            break;
        }

        default:
            return null;
    }

    return {
        type: node.type,
        name,
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        sourceText: node.text,
        language,
        filePath,
    };
}

const chunks: Chunk[] = [];

function traverse(
    node: Parser.SyntaxNode,
    language: string,
    filePath: string,
) {
    const chunk = getNodeInfo(node, language, filePath);

    if (chunk) {
        chunks.push(chunk);
    }

    for (const child of node.namedChildren) {
        traverse(child, language, filePath);
    }
}

