// const input  = '(add 2 (subtract 4 2))';

// const tokens = [
//     { type: 'paren',  value: '('        },
//     { type: 'name',   value: 'add'      },
//     { type: 'number', value: '2'        },
//     { type: 'paren',  value: '('        },
//     { type: 'name',   value: 'subtract' },
//     { type: 'number', value: '4'        },
//     { type: 'number', value: '2'        },
//     { type: 'paren',  value: ')'        },
//     { type: 'paren',  value: ')'        }
//   ];

function tokenizer(input) {
    let current = 0;
    let tokens = [];

    while (current < input.length) {
        let char = input[current];

        if (char === '(') {
            tokens.push({
                type: 'paren',
                value: '(',
            })

            current++;
            continue;
        }

        if (char === ')') {
            tokens.push({
                type: 'paren',
                value: ')',
            })

            current++;
            continue;
        }

        let WHITESPACE = /\s/;
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }

        // number ,  连续写入
        let NUMBERS = /[0-9]/;
        if (NUMBERS.test(char)) {
            let value = '';

            while (NUMBERS.test(char)) {
                value += char;
                char = input[++current];
            }

            tokens.push({
                type: 'number',
                value
            })

            continue;
        }

        if (char === '"') {
            let value = '';

            char = input[++current];

            while (char !== '"') {
                value += char;
                char = input[++current];
            }

            char = input[++current];

            token.push({
                type: 'string',
                value
            });

            continue;
        }

        let LETTERS = /[a-z]/i;
        if (LETTERS.test(char)) {

            let value = '';

            while (LETTERS.test(char)) {
                value += char;
                char = input[++current]
            }
            tokens.push({ type: 'name', value });

            continue;
        }
        throw new TypeError('I dont know what this character is: ' + char);

    }
    return tokens;
}


// const ast = {
//     type: 'Program',
//     body: [{
//         type: 'CallExpression',
//         name: 'add',
//         params: [{
//             type: 'NumberLiteral',
//             value: '2'
//         }, {
//             type: 'CallExpression',
//             name: 'subtract',
//             params: [{
//                 type: 'NumberLiteral',
//                 value: '4'
//             }, {
//                 type: 'NumberLiteral',
//                 value: '2'
//             }]
//         }]
//     }]
// };


function parser(tokens) {
    let current = 0;

    function walk() {
        let token = tokens[current];

        if (token.type === 'number') {
            current++;

            return {
                type: 'NumberLiteral',
                value: token.value
            };
        }

        if (token.type === 'string') {
            current++;
            return {
                type: 'StringLiteral',
                value: token.value,
            };
        }

        if (token.type === 'paren' && token.value ==='(') {
            token = tokens[++current];

            let node = {
                type: 'CallExpression',
                name: token.value,
                params: [],
            };

            token = tokens[++current];

            while (
                (token.type !== 'paren') ||
                (token.type === 'paren' && token.value !== ')')
            ) {
                node.params.push(walk());
                token = tokens[current];
            }

            current++;

            return node;
        }
        throw new TypeError(token.type);
    }

    let ast = {
        type: 'Program',
        body: [],    
    }

    while (current < tokens.length) {
        ast.body.push(walk());
    }

    return ast;
}


function traverser(ast, visitor) {

    function traverseArray(array, parent) {
        array.forEach(child => {
            traverseNode(child, parent);
        });
    }

    function traverseNode(node, parent) {

        let methods = visitor[node.type];

        if (methods && methods.enter) {
            methods.enter(node, parent);
        }

        switch (node.type) {

            case 'Program':
                traverseArray(node.body, node);
                break;

            case 'CallExpression':
            traverseArray(node.params, node);
                break;
                
            case 'NumberLiteral':
                break;

            case 'StringLiteral':
                break;
            
            default:
                throw new TypeError(node.type);                              
        }

        if (methods && methods.exit) {
            methods.exit(node, parent);
        }
    }

    traverseNode(ast, null);
}


// const newAst = {
//     type: 'Program',
//     body: [{
//       type: 'ExpressionStatement',
//       expression: {
//         type: 'CallExpression',
//         callee: {
//           type: 'Identifier',
//           name: 'add'
//         },
//         arguments: [{
//           type: 'NumberLiteral',
//           value: '2'
//         }, {
//           type: 'CallExpression',
//           callee: {
//             type: 'Identifier',
//             name: 'subtract'
//           },
//           arguments: [{
//             type: 'NumberLiteral',
//             value: '4'
//           }, {
//             type: 'NumberLiteral',
//             value: '2'
//           }]
//         }]
//       }
//     }]
//   };


function transformer(ast) {
    
    let newAst = {
        type:  'Program',
        body: []
    }

    ast._context = newAst.body;

    traverser(ast, {
        NumberLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'NumberLiteral',
                    value: node.value,          
                })
            }
        },
        StringLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'StringLiteral',
                    value: node.value,          
                })
                
            }
        },
        CallExpression: {
            enter(node, parent) {
                let expression = {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: node.name,                                    
                    },
                    arguments: [],
                };

                node._context = expression.arguments;

                if (parent.type !== 'CallExpression') {
                    expression = {
                        type: 'ExpressionStatement',
                        expression: expression,
                    };
                }

                parent._context.push(expression);
            },
        }
    })

    return newAst;

}

// get target code u want
function codeGenerator(node) {
    switch (node.type) {
        case 'Program':
            return node.body.map(codeGenerator)
                .join('\n');
        case 'ExpressionStatement':
            return (
                codeGenerator(node.expression) +
                ';' // << (...because we like to code the *correct* way)
            );
        case 'CallExpression':
            return (
                codeGenerator(node.callee) +
                '(' +
                node.arguments.map(codeGenerator)
                    .join(', ') +
                ')'
            );

        // For `Identifier` we'll just return the `node`'s name.
        case 'Identifier':
            return node.name;

        // For `NumberLiteral` we'll just return the `node`'s value.
        case 'NumberLiteral':
            return node.value;

        // For `StringLiteral` we'll add quotations around the `node`'s value.
        case 'StringLiteral':
            return '"' + node.value + '"';

        // And if we haven't recognized the node, we'll throw an error.
        default:
            throw new TypeError(node.type);
    }
}

function compiler (input) {
    let tokens = tokenizer(input);
    let ast = parser(tokens);
    let newAst = transformer(ast);
    let output = codeGenerator(ast);

    return output;
}


module.exports = {
    tokenizer,
    parser,
    traverser,
    transformer,
    codeGenerator,
    compiler
}