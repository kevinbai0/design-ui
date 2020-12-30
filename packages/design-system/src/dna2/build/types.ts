import { ColorKeys } from '../spec/colors';
import { BaseFactory } from '../spec/factory';
import { FontKeys } from '../spec/fonts';
import { MediableProperty, ThemeMedia } from '../spec/media';
import { SpaceKeys, SpaceMultiplier } from '../spec/spacing';

export type ColorPropNames = 'fg' | 'bg';
export type SpacePropNames =
  | 'm'
  | 'p'
  | 'mx'
  | 'my'
  | 'px'
  | 'py'
  | 'mt'
  | 'mb'
  | 'ml'
  | 'mr'
  | 'pb'
  | 'pt'
  | 'pr'
  | 'pl';
export type FontPropNames = 'font';
export type SelectorPropNames<
  Media extends ThemeMedia,
  Fact extends BaseFactory<Media>
> = `$${Fact['media']['selectors'][number]}`;

export type DnaPropNames<
  Media extends ThemeMedia,
  Fact extends BaseFactory<Media>
> =
  | ColorPropNames
  | SpacePropNames
  | FontPropNames
  | SelectorPropNames<Media, Fact>;

export type SelectorProps<
  Media extends ThemeMedia,
  Fact extends BaseFactory<Media>
> = {
  [key in SelectorPropNames<Media, Fact>]?: Omit<
    ThemeDnaProps<Media, Fact>,
    SelectorPropNames<Media, Fact>
  >;
};

export type ColorProps<
  Media extends ThemeMedia,
  Fact extends BaseFactory<Media>
> = {
  [key in ColorPropNames]?: MediableProperty<
    ColorKeys<Fact['colors']>,
    Fact['media']
  >;
};

export type SpaceProps<
  Media extends ThemeMedia,
  Fact extends BaseFactory<Media>
> = {
  [key in SpacePropNames]?: MediableProperty<
    SpaceKeys<Fact['spacing']> | SpaceMultiplier,
    Fact['media']
  >;
};

export type FontProps<
  Media extends ThemeMedia,
  Fact extends BaseFactory<Media>
> = {
  [key in FontPropNames]?: MediableProperty<
    FontKeys<Fact['media'], Fact['fonts']>,
    Fact['media']
  >;
};

export type ThemeDnaProps<
  Media extends ThemeMedia,
  Fact extends BaseFactory<Media>
> = ColorProps<Media, Fact> &
  SpaceProps<Media, Fact> &
  FontProps<Media, Fact> &
  SelectorProps<Media, Fact>;
