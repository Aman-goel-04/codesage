import Parser from "tree-sitter";
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ext = path.extname(__filename);
const __dirname = path.dirname(__filename);

const parser = new Parser();

// const sourceCode = `
// let x = 1;
// let y = 'hey';
// console.log(x);
// function add(a, b) {
//   return a + b;
// }
// const addArror = (a, b) => {
//     return a + b;
// }
// class Animal {
//     constructor(name, age) {
//         this.name = name;
//         this.age = age;
//     }

//     sayHello(){
//         console.log("The name of this animal is 30");
//     }
// }
// `;

// const tree = parser.parse(sourceCode);


// function print(node: Parser.SyntaxNode, indent = "") {
//     console.log(`${indent}${node.type}: "${node.text}"`);
//     console.log(node.startPosition);
//     console.log(node.endPosition);
    
//     for (const child of node.namedChildren) {
//         print(child, indent + "  ");
//     }
// }

// print(tree.rootNode);

// program: "let x = 1;
// let y = 'hey';
// console.log(x);

// function add(a, b) {
//   return a + b;
// }
// class Animal {
//     constructor(name, age) {
//         this.name = name;
//         this.age = age;
//     }

//     sayHello(){
//         console.log("The name of this animal is 30");
//     }
// }
// "
//   lexical_declaration: "let x = 1;"
//     variable_declarator: "x = 1"
//       identifier: "x"
//       number: "1"
//   lexical_declaration: "let y = 'hey';"
//     variable_declarator: "y = 'hey'"
//       identifier: "y"
//       string: "'hey'"
//         string_fragment: "hey"
//   expression_statement: "console.log(x);"
//     call_expression: "console.log(x)"
//       member_expression: "console.log"
//         identifier: "console"
//         property_identifier: "log"
//       arguments: "(x)"
//         identifier: "x"
//   function_declaration: "function add(a, b) {
//   return a + b;
// }"
//     identifier: "add"
//     formal_parameters: "(a, b)"
//       identifier: "a"
//       identifier: "b"
//     statement_block: "{
//   return a + b;
// }"
//       return_statement: "return a + b;"
//         binary_expression: "a + b"
//           identifier: "a"
//           identifier: "b"
//   class_declaration: "class Animal {
//     constructor(name, age) {
//         this.name = name;
//         this.age = age;
//     }

//     sayHello(){
//         console.log("The name of this animal is 30");
//     }
// }"
//     identifier: "Animal"
//     class_body: "{
//     constructor(name, age) {
//         this.name = name;
//         this.age = age;
//     }

//     sayHello(){
//         console.log("The name of this animal is 30");
//     }
// }"
//       method_definition: "constructor(name, age) {
//         this.name = name;
//         this.age = age;
//     }"
//         property_identifier: "constructor"
//         formal_parameters: "(name, age)"
//           identifier: "name"
//           identifier: "age"
//         statement_block: "{
//         this.name = name;
//         this.age = age;
//     }"
//           expression_statement: "this.name = name;"
//             assignment_expression: "this.name = name"
//               member_expression: "this.name"
//                 this: "this"
//                 property_identifier: "name"
//               identifier: "name"
//           expression_statement: "this.age = age;"
//             assignment_expression: "this.age = age"
//               member_expression: "this.age"
//                 this: "this"
//                 property_identifier: "age"
//               identifier: "age"
//       method_definition: "sayHello(){
//         console.log("The name of this animal is 30");
//     }"
//         property_identifier: "sayHello"
//         formal_parameters: "()"
//         statement_block: "{
//         console.log("The name of this animal is 30");
//     }"
//           expression_statement: "console.log("The name of this animal is 30");"
//             call_expression: "console.log("The name of this animal is 30")"
//               member_expression: "console.log"
//                 identifier: "console"
//                 property_identifier: "log"
//               arguments: "("The name of this animal is 30")"
//                 string: ""The name of this animal is 30""
//                   string_fragment: "The name of this animal is 30"


// const sourceCode1 = `
//     function(a, b){}

//     class Animal{}

//     class Animal{
//         constructor(name){
//             this.name = name;
//         }
        
//         Hello(){
//             console.log("Heyyyy");
//         }
//     }
// `

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

