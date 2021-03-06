import { MutableRefObject, useRef, useState, useEffect, useContext } from "react";
import useInteractive from "./useInteractive";
import { RenderComponent, RenderComponents, ComponentStore } from "../components/Playground/ComponentTreeRenderer";
import { nanoid } from "nanoid";
import InteractiveBox, { InteractiveBoxProps } from "../components/Playground/InteractiveBox";
import { LayoutDim, MouseMapper, Point, EditState } from "../utils/types";
import { DefaultTheme, ThemeContext } from "styled-components";
import useEditState from "./useEditState";

export default function(mouseMapper: MutableRefObject<MouseMapper>) {
    const artboardRef = useRef<HTMLDivElement>(null)
    const drawBoxRef = useRef<HTMLDivElement>(null)
    const componentsStore = useRef<ComponentStore>({})

    const theme = useContext(ThemeContext)

    const [ components, setComponents ] = useState<RenderComponents>([])
    const { editState, getEditState, updateEditState } = useEditState()

    // keyboard listener, to refactor later
    useEffect(() => {
        const method = (e: KeyboardEvent) => {
            if (e.key == "b") updateEditState({...getEditState(), mode: { type: "box" }, selected: getEditState().selected})
            else if (e.key == "v") {
                updateEditState({
                    ...getEditState(),
                    mode: {
                        type: "select", value: editState.selected.length ? "selected" : "no-selection"
                    },
                    selected: editState.selected
                })
            }
            if (e.key == "Backspace") {
                if (editState.mode.type == "select" && editState.selected.length) {
                    // delete
                    setComponents(deleteIdsFromTree(editState.selected, components))
                    editState.selected.forEach(id => delete componentsStore.current[id])
                    updateEditState({
                        mode: { type: "select", value: "no-selection" },
                        selected: []
                    })
                }
            }
        }
        window.addEventListener("keyup", method)
        return () => window.removeEventListener("keyup", method)
    })

    // map mouse coordinates to artboard
    function mapCursorToArtboard(point: Point, refPos: LayoutDim) {
        const { x, y } = mouseMapper.current.calculate(point)
        return { x: x - refPos.x, y: y - refPos.y }
    }

    // get drawbox interactions for selection and drawing a new box
    const drawBoxInteractions = createDrawBoxInteractions(drawBoxRef, theme)

    useInteractive(artboardRef, [components, editState], { 
        initialPoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0, width: 0, height: 0 },
        initialEditState: getEditState(),
        selectedElementsInitialState: {} as { [key: string]: LayoutDim }
    })
        .onStart(({e, ref}) => {
            const readonlyState = getEditState()
            const offset: LayoutDim = {
                x: ref.offsetLeft, y: ref.offsetTop, width: ref.offsetWidth, height: ref.offsetHeight
            }
            const mousePos = mapCursorToArtboard({x: e.clientX, y: e.clientY}, offset)

            switch (readonlyState.mode.type) {
                case "box":
                    drawBoxInteractions.onStart(mousePos, readonlyState)
                    return { initialPoint: mousePos, offset, initialEditState: readonlyState, selectedElementsInitialState: {} }
                case "select":
                    const newState = getNewEditState({ x: mousePos.x, y: mousePos.y, width: 0, height: 0 }, readonlyState, componentsStore.current)
                    if (newState && newState.mode.type == "select" && newState.mode.value != readonlyState.mode.value) updateEditState(newState)
                    drawBoxInteractions.onStart(mousePos, editState)

                    return { initialPoint: mousePos, offset, initialEditState: getEditState(), selectedElementsInitialState: {} }
            }
        })
        .onUpdate(({e, state}) => {
            const readonlyState = getEditState()

            const mousePos = mapCursorToArtboard({x: e.clientX, y: e.clientY}, state.offset)
            const rectDim = drawBoxInteractions.onUpdate(mousePos, state.initialPoint, { shouldDraw: readonlyState.mode.type != "select" || readonlyState.mode.value != "translating"})

            switch (readonlyState.mode.type) {
                case "box": return
                case "select": 
                    return handleSelect()
            }

            function handleSelect() {
                if (readonlyState.mode.type != "select") return // handle typescript typechecking
                switch (readonlyState.mode.value) {
                    case "translating":
                        // TODO: need to get initial data from the state
                        getEditState().selected.map(id => componentsStore.current[id]).forEach((component, i) => {
                            component.ref.current.setDimensions({
                                ...component.ref.current.getDimensions(),
                                x: mousePos.x - state.initialPoint.x + state.selectedElementsInitialState[component.component.id].x,
                                y: mousePos.y - state.initialPoint.y + state.selectedElementsInitialState[component.component.id].y
                            })
                        })
                        return
                    default:
                        if (state.initialEditState.mode.type == "select" && state.initialEditState.mode.value == "selected") {
                            // TODO: update the state by getting initial positions for items to be translated
                            updateEditState({
                                ...readonlyState,
                                mode: { type: "select", value: "translating" },
                            })
                            return {
                                ...state,
                                selectedElementsInitialState: getEditState().selected.reduce((accum, id) => {
                                    accum[id] = componentsStore.current[id].ref.current.getDimensions()
                                    return accum
                                }, {})
                            }
                        }

                        const newState = getNewEditState(rectDim, editState, componentsStore.current)
                        if (newState) {
                            updateEditState(newState)
                            return
                        }
                }
            }
        })
        .onEnd(({e, state}) => {
            const readonlyState = getEditState()
            const mousePos = mapCursorToArtboard({x: e.clientX, y: e.clientY}, state.offset)
            const dim = drawBoxInteractions.onEnd(mousePos, state.initialPoint, readonlyState)
            if (dim) {
                const id = nanoid()
                setComponents([...components, createInteractiveBox(id, dim)])
                updateEditState({
                    ...readonlyState,
                    selected: [id]
                })
            }
            if (readonlyState.mode.type == "select" && readonlyState.mode.value == "translating") {
                updateEditState({...editState, mode: { type: "select", value: "selected" }})
            }
        })

    return {
        artboardRef, drawBoxRef, editState, components, componentsStore
    }
}

// handles deleting components. TODO: change to tail recursive function
function deleteIdsFromTree(ids: string[], tree: RenderComponents): RenderComponents {
    // delete from tree
    return tree.reduce((accum, component) => {
        if (component.component.type == "component") {
            if (!ids.includes(component.id)) accum.push(component)
        }
        else {
            const deleted = deleteIdsFromTree(ids, component.component.fn)
            if (deleted.length) accum.push({
                id: nanoid(),
                component: {
                    type: "tree",
                    fn: deleted
                }
            })
        }
        return accum
    }, [] as RenderComponents)
}

// see during a selection, which components are being selected
function getNewEditState(rectDim: LayoutDim, editState: EditState, store: ComponentStore): EditState | undefined {
    // calculate overlap
    const keys = Object.entries(store)
        .filter((pair) => hasOverlap(rectDim, pair[1].ref.current.getDimensions()))
        .map(pair => pair[0])

    // diff active and keys
    const equal = keys.length == editState.selected.length && editState.selected.filter((value, i) => keys[i] != value).length == 0

    if (!equal) {
        return {
            ...editState,
            mode: {
                type: "select",
                value: keys.length ? "selected" : "no-selection"
            },
            selected: keys
        }
    }
}

function hasOverlap(rect1: LayoutDim, rect2: LayoutDim) {
    // check if any points in rect1 are in rect 2
    return pointInRect({ x: rect1.x, y: rect1.y }, rect2)
        || pointInRect({ x: rect1.x, y: rect1.y + rect1.height }, rect2)
        || pointInRect({ x: rect1.x + rect1.width, y: rect1.y }, rect2)
        || pointInRect({ x: rect1.x + rect1.width, y: rect1.y + rect1.height }, rect2)
    // see if points in rect2 are in rect1
        || pointInRect({ x: rect2.x, y: rect2.y }, rect1)
        || pointInRect({ x: rect2.x, y: rect2.y + rect2.height }, rect1)
        || pointInRect({ x: rect2.x + rect2.width, y: rect2.y }, rect1)
        || pointInRect({ x: rect2.x + rect2.width, y: rect2.y + rect2.height }, rect1)
}

function pointInRect(point: Point, rect: LayoutDim) {
    return point.x >= rect.x && point.y >= rect.y && point.x <= rect.x + rect.width && point.y <= rect.y + rect.height
}

function createDrawBoxInteractions(ref: MutableRefObject<HTMLDivElement>, theme: DefaultTheme) {
    function onStart({x, y}: Point, editState: EditState) {
        ref.current!.style.opacity = "1"
        ref.current!.style.left = x + "px"
        ref.current!.style.top = y + "px"
        ref.current!.style.width = "0px"
        ref.current!.style.height = "0px"
        if (editState.mode.type == "box") {
            ref.current.style.backgroundColor = "white";
            ref.current.style.border = "1px solid #888888"
        }
        else if (editState.mode.type == "select") {
            ref.current.style.backgroundColor = "rgba(37,175,239,0.5)"
            ref.current.style.border = "none"
        }
    }
    function onUpdate({x,y}: Point, initialPoint: Point, options: { shouldDraw: boolean }) {
        const dim: LayoutDim = {
            x: Math.min(x, initialPoint.x),
            y: Math.min(y, initialPoint.y),
            width: Math.abs(x - initialPoint.x),
            height: Math.abs(y - initialPoint.y)
        }
        if (options.shouldDraw) {
            ref.current!.style.left = dim.x + "px"
            ref.current!.style.top = dim.y + "px"
            ref.current!.style.width = dim.width + "px"
            ref.current!.style.height = dim.height + "px"
        }
        
        return dim
    }
    function onEnd(pos: Point, initialPoint: Point, editState: EditState): LayoutDim | undefined {
        const width = Math.abs(pos.x - initialPoint.x)
        const height = Math.abs(pos.y - initialPoint.y)
        const left = Math.min(pos.x, initialPoint.x)
        const top = Math.min(pos.y, initialPoint.y)

        ref.current!.style.width = "0px"
        ref.current!.style.height = "0px"
        ref.current!.style.opacity = "0"
        if (width * height == 0 || editState.mode.type == "select") return;
        return { x: left, y: top, width, height }
    }
    return {
        onStart,
        onUpdate,
        onEnd
    }
}

function createInteractiveBox(id: string, dim: LayoutDim): RenderComponent<InteractiveBoxProps> {
    return {
        id,
        component: {
            type: "component",
            fn: InteractiveBox,
            props: {
                id,
                componentDNA: {
                    bg: "grey.0",
                    border: "ghost",
                },
                position: "absolute",
                left: dim.x,
                top: dim.y,
                width: dim.width, 
                height: dim.height,
            }
        }
    }
}