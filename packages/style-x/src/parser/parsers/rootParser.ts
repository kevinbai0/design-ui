import { Parser, ParseType, HandleTokenMethod } from "../parserDefinitions"
import { TokenType } from "../../lexer/lexerDefinitions"
import { ImportExpressionParser } from "./importParsers"
import { ProgramAST, ExpressionAST } from "../../lang/definitions"
import { ExpressionParser, ValueParser } from "./valueParsers"

export function unexpectedToken(token: TokenType, parser: ParseType) {
    return new Error(`Unexpected token "${token.value}" on line ${token.lineNumber}:${token.position} in ${parser}`)
}

export class RootParser extends Parser<ProgramAST> {
    constructor() {
        super("parse_root_program", {
            id: "program",
            definitions: [],
            imports: []
        })
    }

    protected handleToken: HandleTokenMethod<ProgramAST> = (token, ast) => {
        switch (token.value) {
            case "import":
                return this.setDelegate(new ImportExpressionParser(token), completedAst => {
                    this.setAst({
                        ...ast,
                        imports: [...ast.imports, completedAst]
                    })
                })
            case "@override":
                return this.setDelegate(new LetStatementParser(), exprAst => {
                    this.setAst({
                        ...ast,
                        definitions: [...ast.definitions, exprAst]
                    })
                })
            case "let":
                return this.setDelegate(new ExpressionParser({ overridable: false }), exprAst => {
                    this.setAst({
                        ...ast,
                        definitions: [...ast.definitions, exprAst]
                    })
                })
            case "@component":
                return this.setDelegate(new ValueParser(), newAst => {
                    this.setAst({
                        ...ast,
                        component: {
                            id: "component_marker_literal",
                            value: newAst
                        }
                    })
                })
            default:
                if (token.type == "eof") return this.endParser()
                throw unexpectedToken(token, this.id)
        }
    }
}

class LetStatementParser extends Parser<ExpressionAST> {
    constructor() {
        super("parse_let_expresion", {
            id: "expression"
        })
    }

    handleToken: HandleTokenMethod<ExpressionAST> = (token, ast) => {
        if (token.value == "let" && !ast.value) {
            return this.setDelegate(new ExpressionParser({ overridable: true }), (exprAst, refeed) => {
                this.setAst(exprAst)
                this.endParser({ refeed })
            })
        }
        throw unexpectedToken(token, this.id)
    }
}
