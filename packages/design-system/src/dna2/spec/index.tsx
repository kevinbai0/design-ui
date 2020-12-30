import { applyGenerator } from '../build';
import { normalizeTree } from '../build/normalize';
import { createValueTransform } from '../transforms/value';
import { colorArray, generateColors } from './colors';
import { createFactory } from './factory';
import { generateFonts } from './fonts';
import { createSelectors, generateMedia } from './media';
import { generateSpacing } from './spacing';

const { media, mediaFn } = generateMedia({
  breakpoints: {
    tablet: '768px',
    desktop: '1024px',
    xLarge: '1440px',
  },
  selectors: createSelectors('focus', 'hover', 'active'),
});

const colors = generateColors({
  white: '#ffffff',
  black: '#131313',
  greys: colorArray('#eeeeee', '#cccccc', '#aaaaaa', '#888888'),
});

const fonts = generateFonts<typeof media>()({
  families: {
    main: 'Calibri',
  },
  weights: {
    normal: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  sizeClasses: {
    h1: ['48px', '64px', '1.5px'],
    h2: ['32px', '48px', '1px'],
    h3: ['24px', '36px', '0.5px'],
    h4: ['20px', '28px', '0.25px'],
    h5: ['16px', '24px', '0.25px'],
    body: ['16px', '24px', '0.25px'],
    small: ['12px', '16px', '0.25px'],
  },
  fonts: {
    h1: {
      family: 'main',
      weight: 'bold',
      sizeClass: 'h1',
    },
    h2: {
      family: 'main',
      weight: _ => ['normal', _.tablet('bold')],
      sizeClass: _ => ['h2', _.desktop('h1')],
    },
    h3: {
      family: 'main',
      weight: 'normal',
      sizeClass: 'h3',
    },
    h4: {
      family: 'main',
      weight: 'normal',
      sizeClass: 'h4',
    },
  },
});

const spacing = generateSpacing()({
  baseMultiplier: '8px',
  aliases: {
    gap: '1x',
    'app-margin-x': '5x',
    'card-padding-x': '2x',
  },
});

const factory = createFactory({
  media,
  fonts,
  colors,
  spacing,
});

const applier = applyGenerator(mediaFn, factory);

const res = applier({
  bg: 'black',
  fg: 'greys.3',
  m: '2x',
  font: _ => ['h2', _.desktop('h3')],
  $active: {
    bg: _ => ['black', _.desktop('greys.3')],
  },
  $hover: {
    fg: 'greys.2',
  },
});

console.log(JSON.stringify(res, undefined, 2));
const normalizedTree = normalizeTree(res, media);
console.log(normalizedTree);
const valueTransform = createValueTransform<typeof media, typeof factory>();

const transformed = valueTransform(mediaFn, factory, res);
console.log(JSON.stringify(transformed, undefined, 2));
console.log(JSON.stringify(normalizeTree(transformed, media), undefined, 2));

//console.log(cssTransformer(mediaFn, factory, normalizedTree));
