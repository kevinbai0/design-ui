import { ObjectValue, stringifyValue } from "./values"
import { VariableAST, KeyValueExpressionAST, ArrayAST, ValueAST } from "../lang/definitions"
import { valueAstToObject, writeValue } from "./value"

type ComponentType = "Box" | "Text" | "Img"

export const createComponent = (type: ComponentType, properties: ObjectValue) => {
    let componentStr = `<${type}`
    const { children, ...props } = properties
    Object.keys(props).forEach(key => {
        componentStr += `${key}={${stringifyValue(props[key])}}`
    })
    componentStr += "/>"

    return componentStr
}

export const writeComponent = (variableAst: VariableAST, mappedDefinitions: Record<string, ValueAST>): string | undefined => {
    if (!variableAst.value!.fnCall) return
    const identifier = variableAst.value!.identifiers.join(".")
    const params = variableAst
        .value!.fnCall.value!.map(param => {
            if (param.value?.value!.id == "key_value") {
                const keyVal = param.value?.value! as KeyValueExpressionAST
                return {
                    identifier: keyVal.identifier,
                    value: keyVal.value!
                }
            }
        })
        .filter(param => param?.value)

    const withoutChildren = params.filter(param => param?.identifier != "children")
    const children = params.find(param => param?.identifier == "children")

    const tagDefinition = `<${identifier} ${withoutChildren
        .map(param => {
            return `${param?.identifier}={${writeValue(valueAstToObject(param!.value, mappedDefinitions))}}`
        })
        .join(" ")}`
    if (!children) return `${tagDefinition} />`

    if (children.value.value!.id == "variable_literal") {
        return `${tagDefinition}>\n${writeComponent(children.value!.value! as VariableAST, mappedDefinitions)}</${identifier}>`
    }
    if (children.value.value!.id == "array_literal") {
        return `${tagDefinition}>\n${(children.value!.value! as ArrayAST)
            .value!.map(value => {
                if (value.value!.id != "variable_literal")
                    throw new Error(`Expected components but got ${children.value.value!.id} on line ${children.value.lineNumber}:${children.value.position}`)

                return writeComponent(value.value as VariableAST, mappedDefinitions)
            })
            .join("\n")}\n</${identifier}>`
    }
    throw new Error(`Expected components but got ${children.value.value!.id} on line ${children.value.lineNumber}:${children.value.position}`)
}
