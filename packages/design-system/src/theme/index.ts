import { Theme, Dimension, ThemeExtension } from "./types"

const breakpoints = [0, 576, 768, 992, 1200]

const colors = {
    primary: "#E631E9",
    action: "#129AEC",
    foreground: "#131313",
    background: "#FFFFFF",
    "grey.0": "#FFFFFF",
    "grey.1": "#F2F2F2",
    "grey.2": "#C1C1C1",
    "grey.3": "#AAAAAA",
    "grey.4": "#888888",
    "grey.5": "#333333",
    "grey.6": "#131313",
    "grey.7": "#000000"
}

const fontFamily = {
    mainFont: 'Arial'
}

const fontSizes = {
    title: [32, 32, 32, 48],
    body: 14,
    bigBody: 16,
    header: [24, 24, 24, 32],
    header2: [18, 18, 18, 20]
}


const fonts = {
    header: {
        family: "mainFont",
        size: "header",
        weight: 900
    },
    header2: {
        family: "mainFont",
        size: "header2",
        weight: 700
    },
    body: {
        family: "mainFont",
        size: "body",
        weight: 400
    },
    bigBody: {
        family: "mainFont",
        size: "bigBody",
        weight: 400
    }
}

const shadows = {
    default: `0 2px 10px 0 rgba(0,0,0,0.2);`
}

const space = {
    none: 0,
    nudge: 2,
    shift: 5,
    push: [5, 5, 5, 10],
    breathe: [10, 10, 10, 20],
    gap: [20, 20, 20, 40]
}

const borderRadius = {
    none: 0, 
    small: 3,
    default: 5, 
    big: 10
}

const borders = {
    none: "none",
    ghost: {
        width: 1,
        style: "solid",
        color: "grey.4"
    },
    action: {
        width: 1,
        style: "solid",
        color: "action"
    },
    mobileOutline: [
        { width: 1, style: "solid", color: "foreground" },
        { width: 1, style: "solid", color: "foreground" },
        { width: 1, style: "solid", color: "foreground" },
        "none"
    ]
}

const defaultTheme = {
    breakpoints,
    colors, 
    fonts, 
    fontFamily, 
    fontSizes, 
    space, 
    borderRadius, 
    shadows, 
    borders,
    layout: {
        row: `
            display: grid;
            grid-template-rows: 1fr;
            justify-items: start;
            grid-auto-flow: column;
        `,
        col: `
            display: grid;
            grid-template-columns: 1fr;
            grid-auto-flow: row;
        `,
        box: `
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: auto;
        `
    }
}

export type InitialTheme = typeof defaultTheme

export const createTheme = <NewTheme>(props: NewTheme) => {
    return extendTheme(props);
}

const extendTheme = <T extends Partial<Theme<ThemeExtension>>>(themeOptions: T): Theme<T> => {
    return {
        ...themeOptions,
        breakpoints: [
            ...defaultTheme.breakpoints
        ],
        colors: {
            ...defaultTheme.colors,
            ...themeOptions.colors
        },
        space: {
            ...defaultTheme.space,
            ...themeOptions.space
        },
        fontFamily: {
            ...defaultTheme.fontFamily,
            ...themeOptions.fontFamily
        },
        fontSizes: {
            ...defaultTheme.fontSizes,
            ...themeOptions.fontSizes
        },
        fonts: {
            ...defaultTheme.fonts,
            ...themeOptions.fonts
        },
        borderRadius: {
            ...defaultTheme.borderRadius,
            ...themeOptions.borderRadius
        },
        borders: {
            ...defaultTheme.borders,
            ...themeOptions.borders
        },
        shadows: {
            ...defaultTheme.shadows,
            ...themeOptions.fontFamily
        },
        layout: {
            ...defaultTheme.layout,
            ...themeOptions.layout
        }
    }
}