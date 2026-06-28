import Parser from "tree-sitter";
import Javascript from "tree-sitter-javascript";

const parser = new Parser();
parser.setLanguage(Javascript);

const sourceCode = `
    const obj = {
        foo() {}
    };
    const obj = {
        foo: () => {},
        bar: function() {}
    }
`;

const tree = parser.parse(sourceCode);
function print(node: Parser.SyntaxNode, indent = "") {
	console.log(indent + node.type);
	for (const child of node.children) {
		print(child, indent + "  ");
	}
}

print(tree.rootNode);