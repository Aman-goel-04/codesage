import Parser from "tree-sitter";

function isFunctionNode(node: Parser.SyntaxNode | null): boolean {
    return !!node && (
        node.type === "arrow_function" ||
        node.type === "function_expression" ||
        node.type === "function_declaration"
    );
}

function hasToken(node: Parser.SyntaxNode, token: string): boolean {
    return node.children.some(child => child.type === token);
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
        if (current.type === "export_statement")
            return true;

        current = current.parent;
    }

    return false;
}

function makeChunk(
    node: Parser.SyntaxNode,
    kind: Chunk["type"],
    name: string | null,
    language: string,
    filePath: string,
): Chunk {
    return {
        type: kind,
        name,
        exported: isExported(node),
        async: isAsync(node),
        generator: isGenerator(node),
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        sourceText: node.text,
        language,
        filePath,
    };
}


type Chunk = {
    type: "function" | "class" | "method";
    name: string | null;
    exported: boolean;
    async: boolean;
    generator: boolean;
    startLine: number;
    endLine: number;
    sourceText: string;
    language: string;
    filePath: string;
};

function getNodeInfo(
    node: Parser.SyntaxNode,
    language: string,
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

            if (!isFunctionNode(value))
                return null;

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

            if (!isFunctionNode(value))
                return null;

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

const chunks = [];

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